require 'uri'
require 'json'
require 'mini_magick'


module Plants

    class PlantRenderer < Jekyll::Renderer
      def initialize(site, plants, site_payload = nil)
        @site     = site
        @payload  = site_payload
        @layouts  = nil
        @plants   = plants
      end

      def run
        rendered = ""
        for plant in @plants
          @document = plant
          # layout must be set here, to quarantee correct rendering
          @document.data['layout'] = 'plant'
          rendered += super
          if plant != @plants.last
            rendered += "<hr>"
          end
        end

        # emplace merged pages into default layout
        @document.content = rendered
        @document.data['layout'] = 'plant_default'
        @document.data['title'] = @plants.first.data['name']
        @document.data['render_with_liquid'] = false

        info = {
          :registers        => { :site => site, :page => payload["page"] },
          :strict_filters   => liquid_options["strict_filters"],
          :strict_variables => liquid_options["strict_variables"],
        }

        output = place_in_layouts(rendered, payload, info)

        output
      end
    end

    class PlantPage < Jekyll::Page
      def initialize(site, base, dir, name, plants)
        @site = site
        @base = base
        @ext = ".html"

        @dir = dir + plants.first.basename_without_ext.gsub('_', '-') + ext

        @tags = []

        @plants = plants

        # sort plants
        @plants.sort_by! { |plant| plant.url }

        @renderer = PlantRenderer.new(site, @plants)

        generate_tags()

        # not sure which plant is picked for the page
        # therefore add tags to all plants
        @plants.each do |plant|
          plant.data['tags'] = @tags
          plant.data['purl'] = @url
        end

        @data = {
          'layout' => 'none',
          'style' => '/assets/css/plants.css',
          'plant' => plants.first,
        }
      end

      def generate_tags()
        for plant in @plants
          for attr in site.data["filter_attributes"]
            tag = plant.data[attr]
            unless tag.nil? or @tags.include? tag
              @tags << tag
            end
          end
        end
      end
    end

    class PlantThumbPage < Jekyll::Page
      def initialize(site, base, dir, id, plant)
        @site = site
        @base = base
        @ext = ".html"
        @entries = 0

        @dir = dir + id.to_s + ext

        @data = {
          'layout' => 'plant_thumb',
          'plant' => plant,
          'style' => '/assets/css/plants.css',
          'oid' => id,
          'name' => plant.data['name'],
          'thumb' => "/assets/img/plants/thumbs/" + File.basename(plant.data['images'][0]["path"])
        }
      end

      def url_placeholders
        {
          :path       => @dir,
          :category   => 'plants',
          :basename   => basename,
          :output_ext => output_ext,
        }
      end

      def entries()
        @entries
      end

    end

    class PlantPageGenerator < Jekyll::Generator
      def generate(site)

        # collect all possible attributes
        site.data["filter_attributes"] = []
        site.data["filter_values"] = {}

        # get all attributes from the config file
        site.config['plant_attributes'].each do |attr|
          attr[1].each { |v|
            site.data["filter_attributes"] << v
          }
        end

        for attr in site.data["filter_attributes"]
          site.data["filter_values"][attr] = site.collections['plants'].docs.map { |doc| doc.data[attr] }.uniq.compact
        end

        # render all plant pages
        site.collections['plants'].docs.each_with_index do |doc, i|
          same_plants = []
          same_plants << doc
          for other_doc in site.collections['plants'].docs
            if other_doc.data['name'] == doc.data['name'] and other_doc != doc
              same_plants << other_doc
              site.collections['plants'].docs.delete(other_doc)
            end
          end

          doc.data['title'] = doc.data['name']

          page = PlantPage.new(site, site.source, '/plants/', doc.data['name'], same_plants)
          site.pages << page

          # values for xml feed
          doc.data['image'] = doc.data['images'][0]['path']
          if doc.data['excerpt'].nil?
            doc.data['excerpt'] = doc.content[0..1000]
          end
        end

        Jekyll.logger.info "Plant Picture Library:" , "Generated Plant Picture Library"
      end
    end

    class PlantThumbGenerator < Jekyll::Generator
      def generate(site)
        # collect all other attributes
        site.collections['plants'].docs.each_with_index do |doc, i|
          doc.data['oid'] = i
          page = PlantThumbPage.new(site, site.source, '/plants/', i, doc)
          site.pages << page
        end

        Jekyll.logger.info "Plant Picture Library:" , "Generated Plant Thumbnails"
      end
    end

    # hook to reduce image size for thumbnails
    Jekyll::Hooks.register :site, :post_write do |site|
      thumbdir = "/assets/img/plants/thumbs/"

      for doc in site.collections['plants'].docs
        imgfile = doc.data['images'][0]['path']

        if !imgfile.start_with?('/')
          imgfile = '/' + imgfile
        end
        imgfile = site.source + imgfile
        image = MiniMagick::Image.open(imgfile)
        image.resize("500x500")

        thumbfile = site.dest + thumbdir + File.basename(imgfile)
        FileUtils.mkdir_p(site.dest + thumbdir)
        image.write(thumbfile)
      end
    end
end