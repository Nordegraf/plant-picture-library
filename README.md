# plant-picture-library
Website to manage pictures of plants I take


# How to add Plant Observations
Plant, or rather single observations of a species, are organised within the _plants directory.

An observation has following required and optional front matter attributes:

| required | name | If possible a common name of the species, if no common name is availabe, then this should be the scientific name |
| optional | scientific | Scientific name of the specie, if not already given in the name attribute |
| optional | synonyms | List of name synonyms of the species |
| optional | german | German name of the species |
| required | country | Country where the plant was observed |
| required | location | Location where the plant was observed |
| required | date | Date when the plant was observed |
| required | images | List of images of the plant |
| | | This attribute must be a list of images, each image has following attributes: |
| | | path: Path to the image file |
| | | alt: Alternative text for the image |
| | | description: Description of the image |
| optional | by | Name of the person who took the pictures |
| optional | author | Name of the person who identified the plant or wrote the notes |
| optional | coordinates | Coordinates of the location of the observation |

The front matter is followed by the notes of the observation. These notes may contain any kind of markdown or html content. Usually they contain stories about the observation, notes about the identification of the plant, links to other resources, information about the observed species, its uses or anything else that might be interesting.

If no notes are given, no note section will be rendered. But I highly encourage you to write some notes.

The Layout of every observation is set to 'plant' and the title of a page is set to the name of the plant, through this pages [Ruby plugin](_plugins/plant_library.rb).