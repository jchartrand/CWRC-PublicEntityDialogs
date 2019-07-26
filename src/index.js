/**
 * Module providing bootstrap dialogs for finding and selecting entities.
 * @module cwrc-public-entity-dialogs
 */

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

let Cookies = require('js-cookie')

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
    float: none !important; /* islandora css conflict */
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

let entitySources;
/**
 * Register the entity lookup sources that will be used by this module.
 * The sources object should have keys which correspond to the 4 entity types.
 * The values of those keys should be Maps where the key is the lookup ID and the value is the lookup module.
 * @see cwrc-public-entity-dialogs.lookupSourceMetadata
 * @example
 * const viaf = require('viaf-entity-lookup')
 * const dbpedia = require('dbpedia-entity-lookup')
 * const sources = {
 *  person: (new Map()).set('viaf', viaf).set('dbpedia', dbpedia),
 *  place: (new Map()).set('viaf', viaf).set('dbpedia', dbpedia),
 *  organization: (new Map()).set('viaf', viaf).set('dbpedia', dbpedia),
 *  title: (new Map()).set('viaf', viaf).set('dbpedia', dbpedia)
 * }
 * @memberof module:cwrc-public-entity-dialogs
 * @param {Object} sources
 */
function registerEntitySources(sources) {
    entitySources = sources;
}

let entityFormsRoot = '';
/**
 * Set the URL for where the [CWRC entity management forms]{@link https://github.com/cwrc/cwrc-entity-management-forms-static} are located.
 * Currently only used by [Islandora CWRC Writer]{@link https://github.com/cwrc/Islandora-CWRC-Writer}.
 * @memberof module:cwrc-public-entity-dialogs
 * @param {String} url 
 */
function setEntityFormsRoot(url) {
    entityFormsRoot = url;
}

let collectionsRoot = '';
/**
 * Set the URL to use as the top level collection for create title entities.
 * Currently only used by [Islandora CWRC Writer]{@link https://github.com/cwrc/Islandora-CWRC-Writer}.
 * @see 'cwrc-title-entity-dialog'
 * @memberof module:cwrc-public-entity-dialogs
 * @param {String} url
 */
function setCollectionsRoot(url) {
    collectionsRoot = url;
}

let showCreateNewButton = true;
/**
 * Whether to show the Create New button, used to spawn the [CWRC entity management forms]{@link https://github.com/cwrc/cwrc-entity-management-forms-static}.
 * Currently only used by [Islandora CWRC Writer]{@link https://github.com/cwrc/Islandora-CWRC-Writer}.
 * @memberof module:cwrc-public-entity-dialogs
 * @param {Boolean} value 
 */
function setShowCreateNewButton(value) {
    if (typeof value === 'boolean') {
        showCreateNewButton = value;
    }
}

let showEditButton = true;
/**
 * Whether to show the Edit Selected button, used to spawn the [CWRC entity management forms]{@link https://github.com/cwrc/cwrc-entity-management-forms-static}.
 * Currently only used by [Islandora CWRC Writer]{@link https://github.com/cwrc/Islandora-CWRC-Writer}.
 * @memberof module:cwrc-public-entity-dialogs
 * @param {Boolean} value 
 */
function setShowEditButton(value) {
    if (typeof value === 'boolean') {
        showEditButton = value;
    }
}

let showNoLinkButton = true;
/**
 * Whether to show the Tag Without Linking button, which allows the user to skip this dialog in the entity tagging process.
 * @memberof module:cwrc-public-entity-dialogs
 * @param {Boolean} value 
 */
function setShowNoLinkButton(value) {
    if (typeof value === 'boolean') {
        showNoLinkButton = value;
    }
}

// used to check if the user has selected what lookup sources they want to use
// selections get stored in a cookie
let haveSourcesBeenSelected = false;
const SOURCES_COOKIE_NAME = 'cwrc-public-entity-dialogs-lookup-sources';

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
        $('#cwrc-entity-lookup [data-toggle=tooltip]').tooltip('destroy');
        destroyModal('cwrc-entity-lookup')
        destroyModal('cwrc-entity-lookup-edit-sources-dialog')
        destroyModal('cwrc-title-entity-dialog')
    } else {
        let modal = $('#'+modalId);
        if (modal[0] !== undefined) {
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
}

/**
 * Call the success method specified in searchOptions with the entity lookup result.
 * @protected
 * @memberof module:cwrc-public-entity-dialogs
 * @param {Object} result The entity lookup result
 * @param {String} result.uri The entity URI
 * @param {String} result.name The entity name/lemma
 * @param {String} result.repository The name of the entity lookup source
 */
function returnResult(result) {
    destroyModal()
    currentSearchOptions.success(result);
}

function cancel() {
    destroyModal()
    if (currentSearchOptions.cancelled) currentSearchOptions.cancelled()
}

function clearOldResults() {
    selectedResult = undefined
    $('.cwrc-result-list').empty()
}

function rerunSearch() {
    find($('#cwrc-entity-query').val());
}

function find(query) {
    clearOldResults()
    entitySources[currentSearchOptions.entityType].forEach(
        (entitySource, entitySourceName)=>{
            if (isSourceEnabled(entitySourceName)) {
                entitySource[currentSearchOptions.entityLookupMethodName](query).then(
                    (results)=>showResults(results, entitySourceName),
                    (error)=>showError(error, entitySourceName)
                )
            }
        }
    )
}

function destroyPopover() {
    $('#cwrc-entity-lookup').off('.popover')
    $('#entity-iframe').off('load')
    if (popoverAnchor) {
        popoverAnchor.popover('destroy')
        popoverAnchor = null;
    }
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
            sanitize: false, // needed for iframe to be rendered in bootstrap 3.4.1+
            content: ()=>`<div id="entity-iframe-loading" style="width:38em">Loading...</div>
            <iframe id="entity-iframe" src="${result.uriForDisplay}" style="display:none;border:none;height:40em;width:38em"/>`
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

            let liEl = $(`<li class="list-group-item cwrc-result-item">${resultItem}</li>`).appendTo(resultList)
            $(liEl).on('click', function (ev) {
                $('.cwrc-result-item', '.cwrc-result-panel').removeClass('active')
                if (selectedResult === result) {
                    selectedResult = undefined
                } else {
                    $(this).addClass('active')
                    selectedResult = result
                    if (result.uriForDisplay) {
                        showPopover(result, liEl, ev)
                    }
                }
                handleSelectButtonState()
                handleEditButtonState()
            })
            $(liEl).on('dblclick', function (ev) {
                returnResult(result)
            })
        })
    }
}

function showError(error, entitySourceName) {
    let resultList = $(`#cwrc-${entitySourceName}-list`);
    resultList.append(`<li class="list-group-item list-group-item-danger">${error}</li>`)
}

/**
 * The list of possible entity lookup sources, their IDs, titles, and whether or not they're enabled.
 * @name lookupSourceMetadata
 * @memberof module:cwrc-public-entity-dialogs
 * @property {String} cwrc
 * @property {String} viaf
 * @property {String} dbpedia
 * @property {String} geonames
 * @property {String} getty
 * @property {String} wikidata
 */
const lookupSourceMetadata = {
    'cwrc': {
        title: 'CWRC',
        enabled: true
    },
    'viaf': {
        title: 'VIAF',
        enabled: true
    },
    'dbpedia': {
        title: 'DBPedia',
        enabled: true
    },
    'geonames': {
        title: 'GeoNames',
        enabled: true
    },
    'getty': {
        title: 'Getty ULAN',
        enabled: true
    },
    'wikidata': {
        title: 'Wikidata',
        enabled: true
    }
}

/**
 * Set which entity lookup sources are enabled, i.e. available to the user.
 * @memberof module:cwrc-public-entity-dialogs
 * @example
 * {'viaf': true, 'wikidata': true, 'getty': true, 'dbpedia': true, 'geonames': true}
 * @param {Object} config
 */
function setEnabledSources(config) {
    for (let source in config) {
        setSourceEnabled(source, config[source]);
    }
    haveSourcesBeenSelected = true;
}

function setSourceEnabled(source, enabled) {
    if (lookupSourceMetadata[source]) {
        lookupSourceMetadata[source].enabled = enabled;
    }
}

function isSourceEnabled(source) {
    let entry = lookupSourceMetadata[source];
    let enabled = entry.enabled === undefined ? true : entry.enabled;
    return enabled;
}

function getSelectSourcesForm() {
    let sourceTypes = {};
    for (let type in entitySources) {
        entitySources[type].forEach(
            (entitySource, entitySourceName)=>{
                if (sourceTypes[entitySourceName] === undefined) {
                    sourceTypes[entitySourceName] = [];
                }
                sourceTypes[entitySourceName].push(type);
            }
        )
    }
    let sourceCheckboxes = '';
    for (let source in sourceTypes) {
        let types = sourceTypes[source];
        let label = lookupSourceMetadata[source].title;
        let enabled = lookupSourceMetadata[source].enabled;
        sourceCheckboxes += `
        <div class="checkbox">
            <label><input type="checkbox" ${enabled ? 'checked' : ''} data-source="${source}"/>${label}<br/><span class="small">${types.join(', ')}</span></label>
        </div>`
    }
    return sourceCheckboxes;
}

function saveSourcesForm($inputs) {
    let sourceJSON = {};
    $inputs.each((index, el)=>{
        let source = $(el).data('source');
        let value = $(el).prop('checked');
        sourceJSON[source] = value;
    });
    setEnabledSources(sourceJSON);
    Cookies.set(SOURCES_COOKIE_NAME, sourceJSON, {expires: 93, path: ''}); // expires after approximately 3 months
}

function showSourcesPopover(anchor) {
    function handleSelectSourcesButton() {
        saveSourcesForm(anchor.data('bs.popover').tip().find('input[type=checkbox]'));
        showSourcePanels();
        rerunSearch();
        anchor.popover('hide');
    }

    let hasPopover = anchor.data('bs.popover') !== undefined;
    if (!hasPopover) {
        anchor.popover({
            animation: true,
            trigger: 'manual',
            placement: 'bottom',
            html: true,
            title: 'Select sources',
            sanitize: false,
            content: ()=>`${getSelectSourcesForm()}<button class="btn btn-default" type="submit">Use Selected</button>`
        })
        anchor.on('hide.bs.popover', ()=>{
            anchor.data('bs.popover').tip().find('button[type=submit]').off('click', handleSelectSourcesButton);
        })
    }

    if (anchor.data('bs.popover').tip().is(':visible')) {
        return;
    } else {
        anchor.popover('show')
        anchor.data('bs.popover').tip().css({'min-width': '230px'})
        anchor.popover('show') // need to show again after setting width in order to have correct positioning
        anchor.data('bs.popover').tip().find('button[type=submit]').on('click', handleSelectSourcesButton) // need to add event handling after showing for 2nd time
    }
}

function addHtmlAndHandlers() {
    if (! document.getElementById('cwrc-entity-lookup') ) {
        let panels = ''
        Object.entries(lookupSourceMetadata).forEach((entry) => {
            let id = entry[0];
            let title = entry[1].title;
            panels += `
            <div class="panel panel-default cwrc-result-panel" id="cwrc-${id}-panel">
                <div class="panel-heading">
                    <h4 class="panel-title">
                        <a data-toggle="collapse" data-target="#collapse-${id}">${title}</a>
                    </h4>
                </div>
                <div id="collapse-${id}" class="panel-collapse collapse in">
                    <ul class="list-group cwrc-result-list" id="cwrc-${id}-list">
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
                <div class="row">
                    <div class="col-sm-10">
                        <div class="input-group">
                            <input type="text" placeholder="Enter a name to find" class="form-control" id="cwrc-entity-query"/>
                            <span class="input-group-btn">
                                <button id="cwrc-entity-lookup-redo" type="button" class="btn btn-default"
                                        data-toggle="tooltip" data-placement="top" title="Search">
                                    <span class="glyphicon glyphicon-search" aria-hidden="true"></span>&nbsp;
                                </button>
                            </span>
                        </div>
                    </div>
                    <div class="col-sm-2">
                        <button id="cwrc-entity-lookup-edit-sources" type="button" class="btn btn-default"
                                data-toggle="tooltip" data-placement="top" title="Select Lookup Sources" style="float: right;">
                            <span class="glyphicon glyphicon-cog" aria-hidden="true"></span>&nbsp;
                        </button>
                    </div>
                </div>
                <div style="width: 100%;">
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
                '<button id="cwrc-entity-lookup-nolink" type="button" class="btn btn-default">Tag Without Linking</button>'+
                '<button id="cwrc-entity-lookup-keeplink" type="button" class="btn btn-default">Keep Current Link</button>':''}
                ${showEditButton ? 
                '<button id="cwrc-entity-lookup-edit" type="button" class="btn btn-default">Edit Selected</button>':''}
                ${showCreateNewButton ?
                '<button id="cwrc-entity-lookup-new" type="button" class="btn btn-default">Create New</button>':''}
                <button id="cwrc-entity-lookup-cancel" type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>
            </div>
        </div>
    </div>
</div>
<div id="cwrc-title-entity-dialog" role="dialog" class="modal">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="cwrc-entity-lookup-title" class="modal-title">Create a New Entity</h3>
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
</div>
<div id="cwrc-entity-lookup-edit-sources-dialog" role="dialog" class="modal">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">Select Lookup Sources</h3>
            </div>
            <div class="modal-body">
                ${getSelectSourcesForm()}
            </div>
            <div class="modal-footer">
                <button id="cwrc-entity-lookup-edit-sources-ok" type="button" class="btn btn-default">Use Selected</button>
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
            rerunSearch();
        })

        $('#cwrc-entity-lookup-edit-sources').click(function(event) {
            showSourcesPopover($(this))
        })

        $('#cwrc-entity-lookup-edit-sources-ok').click(()=>{
            saveSourcesForm($('#cwrc-entity-lookup-edit-sources-dialog').find('input[type=checkbox]'));
            destroyModal('cwrc-entity-lookup-edit-sources-dialog');
            layoutPanels();
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

        $('#cwrc-entity-lookup-keeplink').click(function(event) {
            returnResult({
                uri: currentSearchOptions.uri,
                name: currentSearchOptions.name
            })
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

function showSourcePanels() {
    entitySources[currentSearchOptions.entityType].forEach((entitySource, entitySourceName)=>{
        if (isSourceEnabled(entitySourceName)) {
            $(`#cwrc-${entitySourceName}-panel`).show()
        } else {
            $(`#cwrc-${entitySourceName}-panel`).hide()
        }
    })
}

function layoutPanels() {
    if (haveSourcesBeenSelected) {
        doShowModal('cwrc-entity-lookup');
        $('#cwrc-entity-lookup [data-toggle=tooltip]').tooltip();
        handleSelectButtonState();
        handleEditButtonState();

        // hide all panels
        $(".cwrc-result-panel").hide();
        // show panels based on selected sources
        showSourcePanels();
        
        if (currentSearchOptions.query) {
            $('#cwrc-entity-query').val(currentSearchOptions.query)
            find(currentSearchOptions.query)
        }
    } else {
        doShowModal('cwrc-entity-lookup-edit-sources-dialog')
    }
}

/**
 * Initialize and display an entity lookup dialog.
 * @protected
 * @memberof module:cwrc-public-entity-dialogs
 * @param {String} entityType The entity type
 * @param {String} entityLookupMethodName The name of the method to call on the lookup module
 * @param {String} entityLookupTitle The dialog title
 * @param {Object} searchOptions The search options
 * @param {String} searchOptions.query The search query
 * @param {Function} searchOptions.success The function to call with the entity the user selected, see returnResult for the format
 * @param {Function} searchOptions.cancelled The function to call if the user cancelled the dialog
 * @param {Element} [searchOptions.parentEl=document.body] The element to append the dialog to
 * @param {String} [searchOptions.uri] The entity URI, if editing
 * @param {String} [searchOptions.name] The entity name/lemma, if editing
 */
function initialize(entityType, entityLookupMethodName, entityLookupTitle, searchOptions) {
    channel = new BroadcastChannel('cwrc-entity-management-forms')
    channel.onmessage = (id) => {
        if (id === undefined) {
            // add/edit failed so don't return result
        } else {
            const uri = entitySources[currentSearchOptions.entityType].get('cwrc').getEntityRoot()+'/'+id
            returnResult({
                id,
                uri,
                repository: 'cwrc'
            })
        }
        entityFormWindow.close() // always close window
    }

    let lookupSources = Cookies.get(SOURCES_COOKIE_NAME);
    if (lookupSources !== undefined) {
        try {
            let sourcesJSON = JSON.parse(lookupSources);
            setEnabledSources(sourcesJSON);
        } catch(err) {
            console.warn('error parsing cookie "'+SOURCES_COOKIE_NAME+'"', err);
        }
    }

    selectedResult = undefined
    currentSearchOptions = Object.assign(
        {entityType: entityType, entityLookupMethodName: entityLookupMethodName, entityLookupTitle: entityLookupTitle},
        searchOptions
    )

    addHtmlAndHandlers();
    layoutPanels();

    if (currentSearchOptions.uri) {
        $('#cwrc-entity-lookup-keeplink').show();
    } else {
        $('#cwrc-entity-lookup-keeplink').hide();
    }
}

/**
 * Open a person entity lookup dialog.
 * @see cwrc-public-entity-dialogs.initialize
 * @memberof module:cwrc-public-entity-dialogs
 * @param {Object} searchOptions 
 */
function popSearchPerson(searchOptions) {
    return initialize('person', 'findPerson', 'Find a Person', searchOptions)
}
/**
 * Open a place entity lookup dialog.
 * @see cwrc-public-entity-dialogs.initialize
 * @memberof module:cwrc-public-entity-dialogs
 * @param {Object} searchOptions 
 */
function popSearchPlace(searchOptions) {
    return initialize('place', 'findPlace', 'Find a Place', searchOptions)
}
/**
 * Open a organization entity lookup dialog.
 * @see cwrc-public-entity-dialogs.initialize
 * @memberof module:cwrc-public-entity-dialogs
 * @param {Object} searchOptions 
 */
function popSearchOrganization(searchOptions) {
    return initialize('organization', 'findOrganization', 'Find an Organization', searchOptions)
}
/**
 * Open a title entity lookup dialog.
 * @see cwrc-public-entity-dialogs.initialize
 * @memberof module:cwrc-public-entity-dialogs
 * @param {Object} searchOptions 
 */
function popSearchTitle(searchOptions) {
    return initialize('title', 'findTitle', 'Find a Title', searchOptions)
}

module.exports = {
    registerEntitySources: registerEntitySources,

    setEnabledSources: setEnabledSources,

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
