# plant-picture-library
Website to manage pictures my friends an I take of plants.

# How to add Plant Observations
Plant, or rather single observations of a species, are organised within the _plants directory. A template is given in the [_templates/observation.md](_templates/observation.md) file.

An observation has following required and optional front matter attributes:

| required/optional | attribute | description                                                                                               |
|----------|-------------|------------------------------------------------------------------------------------------------------------------|
| required | name        | If possible a common name of the species, if no common name is availabe, then this should be the scientific name |
| optional | scientific  | Scientific name of the specie, if not already given in the name attribute                                        |
| optional | variety     | Variety of the species, if not already given in the name attribute                                               |
| optional | synonyms    | YAML List of name synonyms of the species.                                                                       |
| optional | german      | German name of the species                                                                                       |
| required | country     | Country where the plant was observed                                                                             |
| optional | city        | City where the plant was observed                                                                                |
| required | location    | Location where the plant was observed                                                                            |
| required | date        | Date when the plant was observed                                                                                 |
| required | images      | YAML List of images of the plant. Each image must have the following attributes:                                 |
|          |             | path: Path to the image file                                                                                     |
|          |             | alt: Alternative text for the image                                                                              |
|          |             | description: Description of the image                                                                            |
| optional | by          | Name of the person who took the pictures                                                                         |
| optional | author      | Name of the person who identified the plant or wrote the notes                                                   |
| optional | coordinates | Coordinates of the location of the observation                                                                   |

The content of the page will be rendered inside a notes section. They may contain stories about the observation, notes on the identification process, links to other resources, information about the observed species, its various uses or anything else that might be interesting. If no notes are given, no note section will be rendered. But I highly encourage you to write some notes. Links to additional webpages should be written in html with the ```plink```class (e.g. ```<a class="plink" href="..."> link </a>```)

The Layout of every observation is set to 'plant' and the title of a page is set to the name of the plant, through this pages [Ruby plugin](_plugins/plant_library.rb), so no need to set them manually.

If a single species is observed multiple times, then the observations will be merged into one page. Multiple Observations are welcome, but should at least bring some kind of new information, like a new location, new notes, different dates etc.
