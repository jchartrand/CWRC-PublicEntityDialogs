window.jQuery = window.$ = require('jquery');
require('bootstrap');
let typeahead = require('corejs-typeahead/index.js');
typeahead.loadjQueryPlugin();
let Bloodhound = typeahead.Bloodhound;
let Handlebars = require('handlebars');

require('./stylesheet.js')
/*
The object that is passed to popupSearchXXX :
{
    query: query,
    success: function(result) {
        where the result is described below
    },
    error: function(errorThrown) {
    },
    cancelled: function() {},
    buttons:  an array of buttons, e.g.:
    [{
        label : 'Create New ',
        isEdit : false,
        action : doCreate
    },{
        label : 'Edit ',
        isEdit : true,
        action : doEdit
    }]
}
The object that is returned in the success callback:
{
    result.id    // the cwrcBridge callback overwrites this with the result.uri
    result.uri         
    result.name           
    result.repository  
    result.data  // the cwrc bridge doesn't use this, and actually just deletes it.
}
    The cwrcBridge either passes this to the Entity.setLookupInfo (which uses the id, name, and repository) if the call was the result of a search on
    an existing entity, OR passes the result object to the 'local' dialog.
*/

function popSearchPlace(options) { popSearchVIAF('Find a Place in VIAF', options)}
function popSearchPerson(options) { popSearchVIAF('Find a Person in VIAF', options)}
function popSearchOrganization(options) { popSearchVIAF('Find an Organization in VIAF', options)}
function popSearchTitle(options) { popSearchVIAF('Find a Title in VIAF', options)}

var selected = null;

function initializeVIAF() {
    

    $(document.body).append($.parseHTML(  
            `<div id="searchVIAF" class="modal fade">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                            <h4 id="searchVIAF-title" class="modal-title"></h4>
                        </div>
                        <div class="modal-body">
                            <div style="text-align:center;margin: 0 auto" id="viaf-query">
                              <input class="typeahead tt-query" type="text" placeholder="Lookup Entity" autocomplete="off" spellcheck="false"/>
                            </div>
                            <div id="div-iframe" style="text-align:center;margin-top:2em;border-style: inset; border-color: grey; overflow: scroll; height: 500px; width: 90%"> 
                                <iframe id="viaf-frame" width="100%" height="1000%" src="" sandbox onload="this.contentWindow.document.documentElement.scrollTop=100">Choose a name to show VIAF page.</iframe>
                            </div>
                        </div><!-- /.modal-body --> 
                        <div class="modal-footer">
                            <button id="searchVIAF-cancel" type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>
                            <button id="searchVIAF-select" type="button" class="btn btn-default" disabled>Select</button>
                        </div><!-- /.modal-footer -->   
                    </div><!-- /.modal-content -->
                </div><!-- /.modal-dialog -->
            </div><!-- /.modal -->`
        ));

    var entityTypes = {
        personal: 'Person',
        corporate: 'Organization',
        geographic: 'Place',
        subject: 'Topic',
        uniformtitlework: 'Work',
        uniformtitleexpression: 'Expression',
      }

      var suggestTemplate = '<div>{{displayForm}} ({{nametype}}) <br/><a target="_blank" href="http://viaf.org/viaf/{{viafid}}">http://viaf.org/viaf/{{viafid}}</a></div>';

      var filterResponse = function(response) {
        response.result.forEach(function(resultItem){resultItem.nametype = entityTypes[resultItem.nametype]});
        return response.result;
      }

        var viafResults = new Bloodhound({
          datumTokenizer: Bloodhound.tokenizers.obj.whitespace('value'),
          queryTokenizer: Bloodhound.tokenizers.whitespace,
          
          remote: {
            prepare: function(query, settings) {
                    settings.dataType = "jsonp"
                    settings.url = settings.url.replace('%QUERY', query)
                    return settings;
                },
            url: 'http://viaf.org/viaf/AutoSuggest?query=%QUERY',
            filter: filterResponse
          }
        });

        $('#viaf-query .typeahead').typeahead({
            hint: false,
            highlight: true,
            minLength: 3
        }, {
          name: 'viaf-results',
          limit: 10,
          display: 'displayForm',
          source: viafResults,
          templates: {
            suggestion: Handlebars.compile(suggestTemplate)
          }
        }).bind('typeahead:select', function(ev, suggestion) {
            console.log("in the typeahead select");
            selected = suggestion;
            $('#viaf-frame').attr('src', `http://viaf.org/viaf/${suggestion.viafid}`);
            $('#div-iframe').scrollTop(238)
            $('#searchVIAF-select').prop('disabled', false);
        });
}

function popSearchVIAF(title, options) {
    if (! document.getElementById('searchVIAF') ) {
        initializeVIAF();
    } else {
        $('#viaf-frame').attr('src', '');
        $('#searchVIAF-select').prop('disabled', true);
    }
    $('#searchVIAF-select').on('click', function() {
        let uri = `http://viaf.org/viaf/${selected.viafid}`;
        let result = {   name: selected.displayForm,
                    uri: uri,
                    id: uri,
                    repository: 'viaf'
                }
        $('#searchVIAF').modal('hide');
        options.success(result);
    });

    $('#searchVIAF-cancel').on('click',()=>{if(options.cancelled)options.cancelled()});
    $('#searchVIAF-title').text(title);

    $('#searchVIAF').on('shown.bs.modal', function () {
        $('#viaf-query .typeahead').typeahead('val', options.query).typeahead('open');
       // $('#myInput').focus()
       console.log("modal was shown");
    })

    $('#searchVIAF').modal('show');
    

    
   
}

let notSupported = function() {
    if (! document.getElementById('notSupportedModal') ) {
        $(document.body).append($.parseHTML(  
            `<div id="notSupportedModal" class="modal fade">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-body">
                            <div style="margin-bottom:2em">
                                <button type="button" class="close" data-dismiss="modal" aria-hidden="true" style="float:right"><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></button>
                                <h4 id="gh-modal-title' class="modal-title" style="text-align:center">Not Supported</h4>
                            </div>
                            <div style="margin-top:1em">
                                <div style="margin-top:1em">
                                    Sorry, this feature isn't supported with this version of the CWRC-WRiter. This version assumes
                                    that all entities are managed by a public entity store, with it's own system for creating and
                                    editing entity records.
                                </div>
                            </div>
                            <div style="text-align:center;margin-top:3em;margin-bottom:3em">
                                <div class="input-group" >
                                    <div class="input-group-btn" >
                                        <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
                                    </div>
                                </div> <!--input group -->
                            </div>
                        </div><!-- /.modal-body --> 
                    </div><!-- /.modal-content -->
                </div><!-- /.modal-dialog -->
            </div><!-- /.modal -->`
        ));
    }

    $('#notSupportedModal').modal('show');
}

function emptyFunction() {}

module.exports = {
    initialize: emptyFunction,
    initializeWithCookieData: notSupported,
    initializeWithLogin: notSupported,
    popCreatePerson: notSupported,
    popCreateOrganization: notSupported,
    popCreatePlace: notSupported,
    popCreateTitle: notSupported,
    popSearchPerson: popSearchPerson,
    popSearchOrganization: popSearchOrganization,
    popSearchPlace: popSearchPlace,
    popSearchTitle: popSearchTitle,
    popCreate: {
        person: notSupported, 
        organization: notSupported, 
        place: notSupported, 
        title: notSupported},
    popSearch: {
        person : popSearchPerson,
        organization : popSearchOrganization,
        place : popSearchPlace,
        title : popSearchTitle},
    popEdit: {
        person : notSupported,
        organization : notSupported,
        place : notSupported,
        title : notSupported},
    setCwrcApi: emptyFunction,
    setRepositoryBaseObjectURL: emptyFunction,
    setGeonameUrl: emptyFunction,
    setGoogleGeocodeUrl: emptyFunction,
    setViafUrl: emptyFunction,
    setPersonSchema: emptyFunction,
    setOrganizationSchema: emptyFunction,
    setPlaceSchema:emptyFunction

}