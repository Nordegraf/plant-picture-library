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
          # if no images are given, then this is a dummy page, made to add some information rather than images
          if plant.data['images'].nil?
            @document.data['layout'] = 'plant_dummy'
          else # if images are given, then this is a real plant page
            @document.data['layout'] = 'plant'
          end

          rendered += super
          if plant != @plants.last
            rendered += '<hr class="taxonomy">'
          end
        end

        # emplace merged pages into default layout
        @document.content = rendered
        @document.data['layout'] = 'plant_default'
        @document.data['title'] = @plants.first.data['canonical']
        @document.data['render_with_liquid'] = false
        @document.data['taxonomy'] = @plants.first.data['taxonomy']

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
          if !plant.data['taxonomy'].nil?
            plants.first.data['taxonomy'] = plant.data['taxonomy']
          end
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

        # hack for dummy pages without images
        thumb = ""
        if !plant.data['thumb'].nil?
          thumb = File.basename(plant.data['thumb'])
        elsif !plant.data['images'].nil?
          thumb = File.basename(plant.data['images'][0]["path"])
        else
          Jekyll.logger.error "Plant #{plant.data['canonical']} has no images and no thumbnail given. Either add a thumbnail through the frontmatter attribute thumb, or add images."
        end

        @data = {
          'layout' => plant["thumb_layout"] ? plant["thumb_layout"] : 'plant_thumb',
          'plant' => plant,
          'style' => '/assets/css/plants.css',
          'oid' => id,
          'canonical' => plant.data['canonical'],
          'thumb' => "plants/thumbs/" + thumb,
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

        # generate filter data to hide and show filter buttons later
        filterlookups = {}
        filterattrs = {}

        # get data for sidebar filters. data should be hierarchical.
        sidebardata = {}

        for attr in site.data["filter_values"][site.data["filter_attributes"][0]]
          sidebardata[attr] = []
        end

        for doc in site.collections['plants'].docs
          hierarchy_str = ""
          attrs_str = ""
          for attr in site.data["filter_attributes"]
            if !doc.data[attr].nil?
              value = doc.data[attr].gsub(" ", "_").gsub("'", ":")

              if attrs_str != ""
                attrs_str += " " + attr
              else
                attrs_str = attr
              end
              filterattrs[value] = attrs_str

              filterlookups[value] = hierarchy_str
              hierarchy_str += "." + value

              if hierarchy_str[0] == " "
                hierarchy_str = hierarchy_str[1..-1]
              end
            end
          end

          valuekey = doc.data[site.data["filter_attributes"][0]]
          for attr in site.data["filter_attributes"][1..-1]
            new_value = doc.data[attr]
            if !new_value.nil?
              if sidebardata[valuekey].nil?
                sidebardata[valuekey] = []
              elsif !sidebardata[valuekey].include? new_value
                sidebardata[valuekey].push(new_value)
              end
              valuekey += "." + new_value
            end
          end
        end

        Jekyll.logger.info "PPL", sidebardata

        site.data["sidebar_data"] = sidebardata
        site.data["filter_hierarchy"] = filterlookups
        site.data["filter_hierarchy_attrs"] = filterattrs

        # render all plant pages
        site.collections['plants'].docs.each_with_index do |doc, i|
          same_plants = []
          same_plants << doc
          doc.data['characteristics'] = true
          for other_doc in site.collections['plants'].docs
            if other_doc.data['canonical'] == doc.data['canonical'] and other_doc != doc
              same_plants << other_doc
              site.collections['plants'].docs.delete(other_doc)
            end
          end

          doc.data['title'] = doc.data['canonical']

          if !doc.data['thumb'].nil?
            doc.data['image'] = doc.data['thumb']
          else
            doc.data['image'] = doc.data['images'][0]['path']
          end

          page = PlantPage.new(site, site.source, '/plants/', doc.data['canonical'], same_plants)
          site.pages << page

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

        Jekyll.logger.info "Plant Picture Library:" , "Generated Plant Thumbnail Pages"
      end
    end

    def self.generate_thumbnails(source, dest, site)
      for doc in site.collections['plants'].docs
        imgfile = doc.data['image']

        if !imgfile.start_with?('/')
          imgfile = '/' + imgfile
        end

        thumbfile = dest + File.basename(imgfile)

        # check if file already exists in source directory
        if File.exist?(thumbfile)
          next
        end

        imgfile = source + imgfile
        image = MiniMagick::Image.open(imgfile)
        image.resize("500x500")

        FileUtils.mkdir_p(dest)
        image.write(thumbfile)
      end
    end

    # hook to reduce image size for thumbnails during development
    Jekyll::Hooks.register :site, :post_write do |site|
      if Jekyll.env == 'development'
        # if in development, use source directory
        # otherwise the thumbnails would have to be generated every time the site is built
        thumbdir = site.source + "/assets/img/plants/thumbs/"
        generate_thumbnails(site.source, thumbdir, site)
      else
        thumbdir = site.dest + "/assets/img/plants/thumbs/"
      end

      Jekyll.logger.info "Plant Picture Library:" , "Generated Plant Thumbnails"
    end
end