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

    def self.get_gbif_data(doc, conn)
        name = doc.data['variety'].nil? ? doc.data['canonical'] : doc.data['variety']

        Jekyll.logger.info "Taxonomy Data:" , "Getting GBIF data for " + name

        data = conn.name_suggest(q: name)[0]

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
        addition['taxonomy'] = taxdata

        if doc.data['scientific'].nil?
            addition['scientific'] = data['scientificName']
        end

        return addition
    end

    # hook for GBIF data
    Jekyll::Hooks.register :site, :post_write do |site|

        species = Gbif::Species

        for doc in site.collections['plants'].docs
            if doc.data['taxonomy'].nil? or doc.data['scientific'].nil?
                addition = {}

                data = get_gbif_data(doc, species)
                if data.nil?
                    warn_no_data(doc.data['canonical'])
                    next
                end

                addition = assign_data(doc, data)
                update_yaml_data(addition, doc)

            # if a gbif key is given, but no taxonomy data, fetch it from gbif using the key
            elsif doc.data['taxonomy']['gbifkey'] and doc.data['taxonomy'].length == 1
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
end