define [
  'underscore'
  'collections/subreddit'
  'models/image'
], (_, SubRedditCollection, ImageModel) ->
  IMGUR_TYPES = ['album', 'gallery']

  isImgur = (url) ->
    return url.search('imgur.com') > 0

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
    return if type in IMGUR_TYPES then type else null

  extractImgurData = (data, collection) ->
    url = data.data.url

    unless isImgur url
      console.debug "Incorrect image domain: #{data.data.domain} - id: #{data.data.id}"
      return

    type = getImgurType(url)
    id = getImgurId(url, type)

    console.debug "id: #{id} url: #{url} type: #{type}"

    if type in IMGUR_TYPES
      $.ajax
        url: "https://api.imgur.com/3/#{type}/#{id}"
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
        original_id: data.data.id
        original_url: data.data.url
        url: "http://i.imgur.com/#{id}.png"
        thumbnail: "http://i.imgur.com/#{id}b.png"
      , data.data
    return data


  class ImageCollection extends SubRedditCollection
    limit: 25
    model: ImageModel

    parse: (resp, options) ->
      resp = super(resp, options)
      data = []
      for image in resp
        image = extractImgurData(image, @)
        if image
          data.push image

      return data
