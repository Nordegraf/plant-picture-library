import sys
import glob
import exiftool
import os
from geopy.geocoders import Nominatim
import shutil
from pathlib import Path

class Observation:

    def __init__(self) -> None:
        PPL_PATH = "../../"
        self.image_path = "./images/"
        self.img_asset_path: str = PPL_PATH + "assets/img/plants/"
        self.markdown_path: str = PPL_PATH + "_plants/"
        self.attributes: list = [
            "canonical",
            "common",
            "variety",
            "synonyms",
            "german",
            "country",
            "city",
            "location",
            "coordinates",
            "date",
            "by",
            "author",
            "images"
        ]
        self.data: dict = {}

        self.canonical: str = ""
        self.coordinates: str = ""

    def __rename_images(self, species: str) -> None:
        """
        Rename all images in the images folder to the species name and save them to the assets folder.
        Assets folder structure: assets/img/plants/country/species/species_i.jpg
        """
        # find all images in the images folder
        images = glob.glob(self.image_path + "*.jpg")
        images = sorted(images)

        # rename all images to the species name
        i = 1
        for image in images:
            os.rename(image, f"{self.image_path}{species.lower().replace(' ', '_')}_{i}.jpg")
            i += 1

    def __read_exif_data(self) -> None:
        """
        Read GPS Position and Date from EXIF data and add it to the data dict
        """

        images = glob.glob(self.image_path + "*.jpg")
        lat, lon = 0, 0

        for image in images:
            geotag = ""
            with exiftool.ExifToolHelper() as et:
                data = et.get_tags(image, ["Composite:GPSPosition", "EXIF:DateTimeOriginal"])[0]
                geotag = data.get("Composite:GPSPosition")
                date = data.get("EXIF:DateTimeOriginal")
                if date:
                    date = date.split(" ")[0].split(":")
                    self.data["date"] = f"{date[2]}.{date[1]}.{date[0]}"
                if geotag:
                    self.data["coordinates"] = geotag.replace(" ", ", ")

    def __get_location_data(self, location: str) -> None:
        """
        Get location data from gps coordinates. This includes country, city and a location name if available. The data is added to the data dict.
        """

        geolocator = Nominatim(user_agent="ppl")
        location = geolocator.reverse(location, language="en")
        data = location.raw['address']

        self.data["country"] = data.get('country')
        self.data["city"] = data.get('city')
        if data.get("historic"):
            self.data["location"] = data.get("historic")
        elif data.get("tourism"):
            self.data["location"] = data.get("tourism")

    def __convert_gps_to_google_coordinates(self, coords, coords_ref) -> str:
        """
        helper function to convert gps coordinates of the format '38 deg 42' 47.24" N'
        to google maps coordinates of the format '38.713122, -9.133287'
        """
        direction = {'N':1, 'S':-1, 'E': 1, 'W':-1}
        converted = float(coords[0]) + float(coords[1])/60.0 + float(coords[2])/3600.0 * direction[coords_ref]
        return converted

    def __convert_input_coordinates(self, coords) -> str:
        """
        helper function to detect if coordinate data from user input was given in decimal or in the format '38 deg 42' 47.24" N, 9 deg 8' 0.57" W'
        """

        if any(x in coords for x in ('N', 'S', 'E', 'W')):
            coords.replace("deg", "").replace("°", "").replace("'", "").replace('"', "")
            coords = coords.split(",")
            lat = self.__convert_gps_to_google_coordinates(coords[0][0:2], coords[0][-1])
            lon = self.__convert_gps_to_google_coordinates(coords[1][0:2], coords[1][-1])
            return f"{lat}, {lon}"
        else:
            return coords.replace('"', "")

    def __add_image_data_and_move(self) -> None:
        """
        Add and prepare image data to the data dict and move the images to the assets folder.
        """

        images = glob.glob(self.image_path + "*.jpg")

        country = self.data.get("country").lower().replace(" ", "_")
        species = self.data.get("canonical").lower().replace(" ", "_")
        asset_path = f"{self.img_asset_path}{country}/{species}/"
        Path(asset_path).mkdir(parents=True, exist_ok=True)

        for image in images:
            shutil.move(image, asset_path)
            image_path = f"{asset_path.replace('../', '').replace('./', '')}{image.replace(self.image_path, '')}"
            self.data["images"].append(image_path)

        self.data["images"] = sorted(self.data["images"])

    def __create_markdown(self) -> str:
        """
        Create the markdown file for the observation and add the data from the data dict.
        For data that is not available, an empty string is added. Returns the filename of the markdown file.
        """
        # check if observation already exists
        filename = self.markdown_path + self.data.get("canonical").lower().replace(" ", "_") + ".md"

        # if observation already exists, add a number to the filename
        i = 1
        while os.path.exists(filename):

            if i == 1:
                filename = filename.replace(".md", f"_{i}.md")
            else:
                filename = filename.replace(f"_{i-1}.md", f"_{i}.md")

            i += 1

        # create markdown file
        with open(filename, "w") as f:

            f.write("---\n")

            for attribute in self.attributes:

                data = self.data.get(attribute)

                if attribute == "images":
                    f.write(f"{attribute}: {self.__images_yaml(data)}\n")
                else:
                    f.write(f"{attribute}: {'' if data is None else data}\n")

            f.write("---\n")

        return filename

    def __images_yaml(self, images: list) -> str:
        """
        Create the yaml for the images list in the markdown file.
        """
        yaml = "\n"
        for image in images:
            yaml += f"  - path: {image}\n"
            yaml += f"    alt:\n"
            yaml += f"    description:\n"

        return yaml

    def add_species(self) -> None:
        """
        Implements the process to add a new species to the _plants folder.
        """
        print("Enter species name: ")
        canonical = input()
        canonical = canonical[0].upper() + canonical[1:].lower()
        self.canonical = canonical
        self.data["canonical"] = self.canonical

        self.__read_exif_data()

        if not self.data.get("date"):
            print("No date found, please enter date in the format 'dd.mm.yyyy': ")
            date = input()
            self.data["date"] = date

        if not self.data.get("coordinates"):
            print("No geotag found, please enter coordinates either in decimal or in the format '38 deg 42' 47.24\" N, 9 deg 8' 0.57\" W': ")
            coordinates = input()
            self.data["coordinates"] = self.__convert_input_coordinates(coordinates)

        self.__get_location_data(self.data.get("coordinates"))

        self.__rename_images(self.canonical)

        self.data["images"] = []
        self.__add_image_data_and_move()

        md_file = self.__create_markdown()

        print("Done! Added an observation of species: " + self.canonical)
        print(f"Please check the markdown file at {md_file} and add the missing data.")

if __name__ == "__main__":
    observation = Observation()
    observation.add_species()
