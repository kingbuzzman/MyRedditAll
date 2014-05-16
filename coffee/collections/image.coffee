define [
  'underscore'
  'collections/subreddit'
  'models/image'
], (_, SubRedditCollection, ImageModel) ->
  getImgurId = (url, type) ->
    part = _.last(url.split('/'))
    id = _.first(part.split('.')).replace(/\#.*$/, '')
    if not type
      id = id.replace(/[sbtmlh]$/, '')
    return id

  getImgurType = (url) ->
    type = url.split('/')[3]
    if type is 'a'
      type = 'album'
    if type is 'g'
      type = 'gallery'
    return if type in ['album', 'gallery'] then type else null

  extractImgurData = (data, collection) ->
    url = data.data.url
    type = getImgurType(url)
    id = getImgurId(url, type)

    if type in ['album', 'gallery']
      apiUrl = "https://api.imgur.com/3/#{type}/#{id}"
      $.ajax
        url: apiUrl
        dataType: 'json'
        beforeSend: (xhr) ->
            xhr.setRequestHeader 'Authorization', 'Client-ID e2a9ca3ebc1c362'
            return
        success: (resp, statusText, jqXHR) ->
          for image in resp.data.images
            imageData =
              data: _.defaults
                id: image.id
                url: "http://i.imgur.com/#{image.id}.png"
                thumbnail: "http://i.imgur.com/#{image.id}b.png"
                title: "#{data.data.title}: #{image.description}"
              , data.data
            collection.add new collection.model(imageData, {parse: true})
          return
      return

    data =
      data: _.defaults
        id: id
        url: "http://i.imgur.com/#{id}.png"
        thumbnail: "http://i.imgur.com/#{id}b.png"
      , data.data
    return data


  class ImageCollection extends SubRedditCollection
    limit: 25
    model: ImageModel

    url: () ->
      return "http://www.reddit.com/r/#{@name}.json?limit=#{@limit}&after=#{@after or ''}"

    parse: (resp, options) ->
      resp = super(resp, options)
      data = []
      for image in resp
        url = image.data.url
        if url.search('imgur') == -1
          console.warn "Incorrect image domain: #{image.data.domain}"
          continue

        image = extractImgurData(image, @)
        if image
          data.push image

      return data
