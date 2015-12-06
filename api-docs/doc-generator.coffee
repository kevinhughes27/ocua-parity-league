class DocGenerator

  constructor: (opts = {})->
    @title = opts.title
    @desc = opts.desc
    @params = opts.params
    @url = opts.url
    @type = opts.type || 'GET'

  generate: (callback) ->
    @callback = callback

    @call = """
      $.ajax({
        url: '#{@url}',
        type: '#{@type}',
        dataType: 'jsonp',
        success: function(data) {
          // code here
        }
      })
    """

    #@_apiCallSuccess({test: 'test'})

    operation = $.ajax
      url: @url
      type: @type
      dataType: 'jsonp'
      success: @_apiCallSuccess

  _apiCallSuccess: (response) =>
    @response = JSON.stringify(response, undefined, 2)
    @_renderDoc()
    @_syntaxHighlight()
    @callback()

  _renderDoc: ->
    template = _.template(TEMPLATES.api_call_doc_template)
    html = template(doc: this)
    $('#main').append(html)

  _syntaxHighlight: ->
    node = _.last($('#main .panel'))
    $(node).find('pre code').each (i, block) ->
      hljs.highlightBlock(block);

TEMPLATES =
  api_call_doc_template: """
  <div class="panel panel-info">

    <div class="panel-heading">
      <h3 class="panel-title"><strong><%= doc.type %></strong> <%= doc.title %></h3>
    </div>

    <div class="panel-body">
      <p><strong>url:</strong> <%= doc.url %></p>

      <p><strong>description:</strong> <%= doc.desc %></p>

      <strong>params:</strong>
      <ul>
        <% _.each(doc.params, function(param) { %>
          <li><%= param %></li>
        <% }) %>
      </ul>

      <pre>
<strong>example:</strong>
<code>
<%= doc.call %>
</code>
      </pre>

      <hr>

      <div class="accordion" id="<%= doc.title %>-accordion">
        <a class="accordion-toggle" data-toggle="collapse" data-parent="#<%= doc.title %>-accordion" href="#<%= doc.title %>-collapse">
          Show Response
        </a>

        <div id="<%= doc.title %>-collapse" class="accordion-body collapse">
          <div class="accordion-inner">
            <pre style="margin-top: 10px">
<code>
<%= doc.response %>
</code>
            </pre>
          </div>
        </div

      </div>

    </div>

  </div>
  """
