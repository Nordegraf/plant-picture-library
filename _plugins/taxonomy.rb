require 'gbifrb'

module Taxonomy

    def self.update_yaml_data(addition, doc)

        content = File.read(doc.path)
        if content =~ Jekyll::Document::YAML_FRONT_MATTER_REGEXP
            ending = Regexp.last_match.end(1)

            frontmatter = SafeYAML.load(Regexp.last_match(1))
            frontmatter = frontmatter.merge(addition)

            content = frontmatter.to_yaml + content[ending..-1]

            File.open(doc.path, "w") {|file| file.puts content }
        end
    end

    def self.get_gbif_data(doc)
        name = doc.data['variety'].nil? ? doc.data['canonical'] : doc.data['variety']

        if doc.data['taxonomy'].nil?
            species = Gbif::Species

            Jekyll.logger.info "Taxonomy Data:" , "Getting GBIF data for " + name

            data = species.name_suggest(q: name)[0]

        elsif doc.data['taxonomy']['gbifkey'] and doc.data['taxonomy'].length == 1
            occ = Gbif::Occurrences

            Jekyll.logger.info "Taxonomy Data:" , "Getting GBIF data for " + name + " with GBIF key " + doc.data['taxonomy']['gbifkey'].to_s

            data = occ.search(taxonKey: doc.data['taxonomy']['gbifkey'])["results"][0]
        end

        return data
    end

    def self.warn_no_data(name)
        Jekyll.logger.warn "Taxonomy Data:" , "Could not get GBIF data for " + name
    end

    def self.assign_data(doc, data)
        addition = {}

        taxdata = doc.data['taxonomy'] || {}

        if taxdata['gbifkey'].nil?
            taxdata['gbifkey'] = data['key']
        end

        # format time to 24.12.2019
        taxdata['fetched'] = Time.now.strftime("%d.%m.%Y")
        taxdata['kingdom'] = data['kingdom']
        taxdata['phylum'] = data['phylum']
        taxdata['class'] = data['class']
        taxdata['order'] = data['order']
        taxdata['family'] = data['family']
        taxdata['genus'] = data['genus']
        taxdata['species'] = data['species']

        if data['rank'] == 'VARIETY'
            taxdata['variety'] = data['scientificName']
        end

        if data['rank'] == 'SUBSPECIES'
            taxdata['subspecies'] = data['scientificName']
        end

        addition['taxonomy'] = taxdata

        if doc.data['scientific'].nil?
            addition['scientific'] = data['scientificName']
        end

        return addition
    end

    # hook for GBIF data
    Jekyll::Hooks.register :site, :post_write do |site|

        for doc in site.collections['plants'].docs
            if doc.data['taxonomy'].nil? or (doc.data['taxonomy']['gbifkey'] and doc.data['taxonomy'].length == 1)

                data = get_gbif_data(doc)
                if data.nil?
                    warn_no_data(doc.data['canonical'])
                    next
                end

                addition = assign_data(doc, data)
                update_yaml_data(addition, doc)
            end
        end
    end

    # hook for hierarchical json data
    Jekyll::Hooks.register :site, :post_write do |site|
        data = {}

        data["name"] = "Plantae"
        data["children"] = []

        for doc in site.collections['plants'].docs
            subdata = data["children"]

            taxdata = doc.data['taxonomy']

            if taxdata.nil?
                next
            end

            # build hierarchical representation
            for rank in ['phylum', 'class', 'order', 'family', 'genus', 'species', 'subspecies', 'variety']
                dpoint = taxdata[rank]
                if dpoint.nil?
                    next
                end

                entry = subdata.find {|entry| entry['name'] == dpoint}

                if entry.nil?
                    entry = {}
                    entry["name"] = dpoint
                    entry["children"] = []
                    subdata << entry
                end

                subdata = entry["children"]
            end

        end

        File.open(site.dest + "/taxonomy.json", "w") {|file| file.puts data.to_json }
    end
end

