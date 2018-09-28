'use strict';

// shared instance of bootstraped jquery for entity and git dialogs
let $ = window.cwrcQuery
if ($ === undefined) {
    let prevJQuery = window.jQuery
    $ = require('jquery')
    window.jQuery = $
    require('bootstrap')
    window.jQuery = prevJQuery
    window.cwrcQuery = $
}

let BroadcastChannel = require('broadcast-channel')
if (BroadcastChannel.default !== undefined) {
	BroadcastChannel = BroadcastChannel.default
}
let channel
let entityFormWindow
let entityFormWindowOptions = 'menubar=no,statusbar=no,toolbar=no'

// custom styles
let styleEl = document.createElement('style')
styleEl.setAttribute('type', 'text/css')
styleEl.appendChild(document.createTextNode(`
.panel-heading a {
    cursor: pointer;
}
.panel-heading a:after {
    font-family:'Glyphicons Halflings';
    content:"\\e114";
    float: right;
    color: grey;
    cursor: pointer;
}
.panel-heading a.collapsed:after {
    content:"\\e080";
}
.list-group .list-group-item {
    cursor: pointer;
}
.list-group .list-group-item:hover {
    color: #555;
    text-decoration: none;
    background-color: #f5f5f5;
}
.list-group .list-group-item.active a {
    color: #fff;
}
.list-group-item .logo {
    display: inline-block;
    width: 30px;
    height: 30px;
    position: relative;
    top: -23.5px;
    float: right;
    vertical-align: middle;
    background-size: cover;
    background-repeat: no-repeat;
}
`))
document.querySelector('head').appendChild(styleEl)

// entitySources is an object passed in by registerEntitySources that looks like:
// where the value of each setter on the map is an imported module.
/*
{
    person: (new Map()).set('cwrc', cwrc).set('viaf', viaf).set('dbpedia': dbpedia).set('wikidata': wikidata).set('getty':getty),
    place: (new Map()).set('viaf', viaf).set('dbpedia': dbpedia).set('wikidata': wikidata).set('getty':getty),
    organization: (new Map()).set('viaf', viaf).set('dbpedia': dbpedia).set('wikidata': wikidata).set('getty':getty),
    title: (new Map()).set('viaf', viaf).set('dbpedia': dbpedia).set('wikidata': wikidata).set('getty':getty),
}
*/
let entitySources;
function registerEntitySources(sources) {
    entitySources = sources;
}

let entityFormsRoot = '';
function setEntityFormsRoot(url) {
    entityFormsRoot = url;
}

let collectionsRoot = '';
function setCollectionsRoot(url) {
    collectionsRoot = url;
}

let showCreateNewButton = true;
function setShowCreateNewButton(value) {
    if (typeof value === 'boolean') {
        showCreateNewButton = value;
    }
}

let showEditButton = true;
function setShowEditButton(value) {
    if (typeof value === 'boolean') {
        showEditButton = value;
    }
}

let showNoLinkButton = true;
function setShowNoLinkButton(value) {
    if (typeof value === 'boolean') {
        showNoLinkButton = value;
    }
}


// data sent to initialize method
let currentSearchOptions = {
    entityType: undefined,
    entityLookupMethodName: undefined,
    entityLookupTitle: undefined,
    searchOptions: undefined
}
// currently selected result
let selectedResult = undefined


function destroyModal(modalId) {
    if (modalId === undefined) {
        destroyModal('cwrc-entity-lookup')
        destroyModal('cwrc-title-entity-dialog')
    } else {
        let modal = $('#'+modalId);
        modal.modal('hide').data( 'bs.modal', null );
        modal[0].parentNode.removeChild(modal[0]);

        if (modalId === 'cwrc-entity-lookup') {
            if (channel) {
                channel.close()
            }
            destroyPopover();
        }
    }
}

function destroyPopover() {
    $('#cwrc-entity-lookup').off('.popover')
    $('#entity-iframe').off('load')
    if (popoverAnchor) {
        popoverAnchor.popover('destroy')
        popoverAnchor = null;
    }
}

function returnResult(result) {
    destroyModal()
    currentSearchOptions.success(result);
}

function cancel() {
    destroyModal()
    if (currentSearchOptions.cancel) currentSearchOptions.cancel()
}

function clearOldResults() {
    selectedResult = undefined
    $('.cwrc-result-list').empty()
}

function find(query) {
    clearOldResults()
    entitySources[currentSearchOptions.entityType].forEach(
        (entitySource, entitySourceName)=>{
            entitySource[currentSearchOptions.entityLookupMethodName](query).then(
                (results)=>showResults(results, entitySourceName),
                (error)=>console.log(`an error in the find: ${error}`))
        }
    )
}


let popoverAnchor = null;
function showPopover(result, li, ev) {

    ev.stopPropagation()

    if (popoverAnchor) {
        if (popoverAnchor[0] === li) {
            return  // we've already got a popup for this list item, so just return
        } else {
            destroyPopover();
            // need to delay show until destroy method finishes hiding the previous popover (default hide time is 150 ms)
            setTimeout(doShow, 175);
        }
    } else {
        doShow();
    }

    function doShow() {
        popoverAnchor = $(li);

        popoverAnchor.popover({
            // delay: { "show": 600, "hide": 100 },
            animation: true,
            trigger: "manual",
            //placement: "auto",
            html: true,
            title: result.name,
            content: ()=>`<div id="entity-iframe-loading" style="width:38em">Loading...</div><iframe id="entity-iframe" src="${result.uriForDisplay}" style="display:none;border:none;height:40em;width:38em"/>`
        })

        popoverAnchor.popover('show')

        $('#entity-iframe').on('load', function(ev) {
            $('#entity-iframe-loading').hide();
            $('#entity-iframe').show();
        });

        // resize the popover
        popoverAnchor.data("bs.popover").tip().css({"max-width": "40em"})

        // add a check on the modal for a click event --> this will close the popover
        $('#cwrc-entity-lookup').on('click.popover', function(ev){
            // close popover
            destroyPopover()
        })
    }
}

function showResults(results, entitySourceName) {
    let resultList = $(`#cwrc-${entitySourceName}-list`);
    if (results.length === 0) {
        resultList.append('<li class="list-group-item">No results</li>')
    } else {
        results.forEach((result, i)=>{
            let resultItem = result.description?
                `<div><b>${result.name}</b> - <i>${result.description}</i></div>`:
                `<div><b>${result.name}</b></div>`

            if (result.externalLink) {
                resultItem += `<div><a href="${result.externalLink}" target="_blank">Open full description in new window</a></div>`
            }
            if (result.logo) {
                resultItem += `<div class="logo" style="background-image: url(${result.logo})"></div>`
            }

            let aEl = $(`<li class="list-group-item cwrc-result-item">${resultItem}</li>`).appendTo(resultList)
            $(aEl).on('click', function (ev) {
                $('.cwrc-result-item', '.cwrc-result-panel').removeClass('active')
                if (selectedResult === result) {
                    selectedResult = undefined
                } else {
                    $(this).addClass('active')
                    selectedResult = result
                    if (result.uriForDisplay) {
                        showPopover(result, aEl, ev)
                    }
                }
                handleSelectButtonState()
                handleEditButtonState()
            })
        })
    }
}

const panelDefs = [{
    id: 'cwrc',
    title: 'CWRC'
},{
    id: 'viaf',
    title: 'VIAF'
},{
    id: 'dbpedia',
    title: 'DBPedia'
},{
    id: 'geonames',
    title: 'GeoNames'
},{
    id: 'geocode',
    title: 'GeoCode'
},{
    id: 'getty',
    title: 'Getty ULAN'
},{
    id: 'wikidata',
    title: 'Wikidata'
}]

function initializeEntityPopup() {
    if (! document.getElementById('cwrc-entity-lookup') ) {
        let panels = ''
        panelDefs.forEach((p, index) => {
            panels += `
            <div class="panel panel-default cwrc-result-panel" id="cwrc-${p.id}-panel">
                <div class="panel-heading">
                    <h4 class="panel-title">
                        <a data-toggle="collapse" data-target="#collapse-${p.id}">${p.title}</a>
                    </h4>
                </div>
                <div id="collapse-${p.id}" class="panel-collapse collapse in">
                    <ul class="list-group cwrc-result-list" id="cwrc-${p.id}-list">
                    </ul>
                </div>
            </div>`
        })

        var el = currentSearchOptions.parentEl || document.body;
        $(el).append($.parseHTML(
`<div id="cwrc-entity-lookup" role="dialog" class="modal fade">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                <h3 id="cwrc-entity-lookup-title" class="modal-title"></h3>
            </div>
            <div class="modal-body">
                <div class="input-group">
                    <input type="text" placeholder="Enter a name to find" class="form-control" id="cwrc-entity-query"/>
                    <span class="input-group-btn">
                        <button id="cwrc-entity-lookup-redo" type="button" class="btn btn-default">
                            <span class="glyphicon glyphicon-search" aria-hidden="true"></span>&nbsp;
                        </button>
                    </span>
                </div>
                <div style="width:100%">
                    <div class="panel-group">
                        ${panels}
                        <div class="panel panel-default">
                            <div class="panel-heading">
                                <h4 class="panel-title">Other / Manual Input</h4>
                            </div>
                            <div class="panel-body">
                                <input type="text" placeholder="Enter URL" class="form-control" id="cwrc-manual-input"/>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button id="cwrc-entity-lookup-select" type="button" class="btn btn-default">Select</button>
                ${showNoLinkButton ? 
                '<button id="cwrc-entity-lookup-nolink" type="button" class="btn btn-default">Tag without entity linking</button>':''}
                ${showEditButton ? 
                '<button id="cwrc-entity-lookup-edit" type="button" class="btn btn-default">Edit selected</button>':''}
                ${showCreateNewButton ?
                '<button id="cwrc-entity-lookup-new" type="button" class="btn btn-default">Create new</button>':''}
                <button id="cwrc-entity-lookup-cancel" type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>
            </div>
        </div>
    </div>
</div>
<div id="cwrc-title-entity-dialog" role="dialog" class="modal">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="cwrc-entity-lookup-title" class="modal-title">Create a new entity</h3>
            </div>
            <div class="modal-body">
                <p>A new window will open, where you can navigate to the desired collection and create the new entity (a citation object).</p>
                <p>Once you're done, return to the current window and re-run the title search. The new entity you created will show up in the results and you will be able to tag it.</p>
            </div>
            <div class="modal-footer">
                <button id="cwrc-title-entity-dialog-ok" type="button" class="btn btn-default">Ok</button>
                <button id="cwrc-title-entity-dialog-cancel" type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>
            </div>
        </div>
    </div>
</div>`
        ));
        $('#cwrc-entity-lookup button[data-dismiss="modal"]').on('click', ()=>cancel());
        
        $('#cwrc-entity-lookup-title').text(currentSearchOptions.entityLookupTitle);

        $('#cwrc-entity-query').keyup(function(event) {
            if (event.which === 13) {
                find($('#cwrc-entity-query').val());
            }
        })

        $('#cwrc-entity-lookup-redo').click(function(event) {
            find($('#cwrc-entity-query').val());
        })

        $('#cwrc-manual-input').keyup(function(event) {
            $(this).parent().removeClass('has-error').find('span.help-block').remove()
            handleSelectButtonState()
        })

        $('#cwrc-entity-lookup-new').click(function(event) {
            if (currentSearchOptions.entityType === 'title') {
                $('#cwrc-entity-lookup').modal('hide')
                doShowModal('cwrc-title-entity-dialog')
            } else {
                openEntityFormWindow(false)
            }
        })

        $('#cwrc-entity-lookup-edit').click(function(event) {
            if (currentSearchOptions.entityType === 'title') {
                $('#cwrc-entity-lookup').modal('hide')
                doShowModal('cwrc-title-entity-dialog')
            } else if (selectedResult !== undefined && selectedResult.repository === 'CWRC') {
                openEntityFormWindow(true)
            }
        })

        $('#cwrc-entity-lookup-select').click(function(event) {
            if (selectedResult !== undefined) {
                returnResult(selectedResult)
            } else {
                let manualInput = $('#cwrc-manual-input').val()
                if (manualInput !== undefined && manualInput !== '') {
                    // from https://gist.github.com/dperini/729294
                    let urlRegex = /^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,}))\.?)(?::\d{2,5})?(?:[/?#]\S*)?$/i
                    if (urlRegex.test(manualInput)) {
                        returnResult({
                            id: manualInput,
                            uri: manualInput,
                            name: 'Custom Entry',
                            repository: 'custom'
                        })
                    } else {
                        if ($('#cwrc-manual-input').parent().hasClass('has-error') === false) {
                            $('#cwrc-manual-input').parent().addClass('has-error').append('<span class="help-block">URL is not valid</span>')
                        }
                    }
                }
            }
        })

        $('#cwrc-entity-lookup-nolink').click(function(event) {
            returnResult({})
        })

        $('#cwrc-title-entity-dialog-ok').click(function(event) {
            openEntityFormWindow()
            $('#cwrc-title-entity-dialog').modal('hide')
            doShowModal('cwrc-entity-lookup')
        })
        $('#cwrc-title-entity-dialog button[data-dismiss="modal"]').click(function(event) {
            $('#cwrc-title-entity-dialog').modal('hide')
            doShowModal('cwrc-entity-lookup')
        })

    }
    doShowModal('cwrc-entity-lookup')
}

function doShowModal(modalId) {
    $('#'+modalId).modal('show');
    
	if (currentSearchOptions.parentEl) {
		var data = $('#'+modalId).data('bs.modal');
		data.$backdrop.detach().appendTo(currentSearchOptions.parentEl);
	}
}

function openEntityFormWindow(isEdit) {
    let url
    if (currentSearchOptions.entityType === 'title') {
        url = collectionsRoot
    } else {
        url = entityFormsRoot + currentSearchOptions.entityType
        if (isEdit) {
            url += '?entityId=' + selectedResult.id
        }
    }
    let width = Math.min(1100, window.outerWidth * 0.8)
    let height = window.outerHeight * 0.8
    let top = (window.outerHeight - height) * 0.5
    let left = (window.outerWidth - width) * 0.5
    entityFormWindow = window.open(url, 'entityFormWindow', entityFormWindowOptions+',width='+width+',height='+height+',top='+top+',left='+left)
}

function handleSelectButtonState() {
    let disable = true
    if (selectedResult !== undefined) {
        disable = false
    } else {
        let manualInput = $('#cwrc-manual-input').val()
        if (manualInput !== undefined && manualInput !== '') {
            disable = false
        }
    }
    if (disable) {
        $('#cwrc-entity-lookup-select').addClass('disabled').prop('disabled', true)
    } else {
        $('#cwrc-entity-lookup-select').removeClass('disabled').prop('disabled', false)
    }
}

function handleEditButtonState() {
    if (showEditButton) {
        if (selectedResult === undefined || selectedResult.repository !== 'CWRC') {
            $('#cwrc-entity-lookup-edit').addClass('disabled').prop('disabled', true)
        } else {
            $('#cwrc-entity-lookup-edit').removeClass('disabled').prop('disabled', false)
        }
    }
}

function layoutPanels() {
    initializeEntityPopup();
    handleSelectButtonState();
    handleEditButtonState();
    // hide all panels
    $(".cwrc-result-panel").hide()
    // show panels registered for entity type
    entitySources[currentSearchOptions.entityType].forEach((entitySource, entitySourceName)=>$(`#cwrc-${entitySourceName}-panel`).show())
}

function initialize(entityType, entityLookupMethodName, entityLookupTitle, searchOptions) {
    channel = new BroadcastChannel('cwrc-entity-management-forms')
    channel.onmessage = (id) => {
        const uri = entitySources[currentSearchOptions.entityType].get('cwrc').getEntityRoot()+'/'+id
        returnResult({
            id,
            uri,
            repository: 'cwrc'
        })
        entityFormWindow.close()
    }

    selectedResult = undefined
    currentSearchOptions = Object.assign(
        {entityType: entityType, entityLookupMethodName: entityLookupMethodName, entityLookupTitle: entityLookupTitle},
        searchOptions
    )
    layoutPanels()
    if (currentSearchOptions.query) {
        document.getElementById('cwrc-entity-query').value = currentSearchOptions.query
        find(currentSearchOptions.query)
    }
}

function popSearchPerson(searchOptions) {
    return initialize('person', 'findPerson', 'Find a Person', searchOptions)
}
function popSearchPlace(searchOptions) {
    return initialize('place', 'findPlace', 'Find a Place', searchOptions)
}
function popSearchOrganization(searchOptions) {
    return initialize('organization', 'findOrganization', 'Find an Organization', searchOptions)
}
function popSearchTitle(searchOptions) {
    return initialize('title', 'findTitle', 'Find a Title', searchOptions)
}

module.exports = {
    // registerEntitySources lets us more easily pass in mocks when testing.
    registerEntitySources: registerEntitySources,

    showCreateNewButton: setShowCreateNewButton,
    showNoLinkButton: setShowNoLinkButton,
    showEditButton: setShowEditButton,

    setEntityFormsRoot: setEntityFormsRoot,
    setCollectionsRoot: setCollectionsRoot,

    popSearchPerson: popSearchPerson,
    popSearchOrganization: popSearchOrganization,
    popSearchPlace: popSearchPlace,
    popSearchTitle: popSearchTitle,

    popSearch: {
        person : popSearchPerson,
        organization : popSearchOrganization,
        place : popSearchPlace,
        title : popSearchTitle
    }

}

/*
The object that is passed to popupSearchXXX :
{
    query: query,
    success: (result)=>{result is described below},
    error: (error)=>{},
    cancelled: ()=>{},
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
