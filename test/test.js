'use strict';

let $ = require('jquery')
const test = require('tape-catch');
const sinon = require('sinon');


// print istanbul's coverage info to the console so we can get it later in our npm script where we save it to a file.
test.onFinish(()=>{
    console.log('# coverage:', JSON.stringify(window.__coverage__))
    window.close()
});

// couple other tests might want:
// - that entity sources aren't shown if the config doesn't list them.
// - no results for an entity source should show a message.


function getQueryOptionsWithCallbackSpy() {
    return {
        query: 'jones',
        success: sinon.spy()
    }
}

const fixtures = require('./fixtures/sourceData');

const sourceEnabledData = {
    geonames: true,
    viaf: true,
    wikidata: true,
    getty: true,
    dbpedia: true
}

function getGeonamesStubs() {
    return {

        findPlace: sinon.stub().resolves(fixtures.geonames.place)
    }
}

function getViafStubs() {
    return {
        findPerson: sinon.stub().resolves(fixtures.viaf.person),
        findPlace: sinon.stub().resolves(fixtures.viaf.place),
        findOrganization: sinon.stub().resolves(fixtures.viaf.organization),
        findTitle: sinon.stub().resolves(fixtures.viaf.title)
    }
}

function getWikidataStubs() {
    return {
        findPerson: sinon.stub().resolves(fixtures.wikidata.person),
        findPlace: sinon.stub().resolves(fixtures.wikidata.place),
        findOrganization:sinon.stub().resolves(fixtures.wikidata.organization),
        findTitle: sinon.stub().resolves(fixtures.wikidata.title)
    }
}

function getGettyStubs() {
    return {
        findPerson: sinon.stub().resolves(fixtures.getty.person),
        findPlace: sinon.stub().resolves(fixtures.getty.place)
    }
}


function getDbpediaStubs() {
    return {
        findPerson: sinon.stub().resolves(fixtures.dbpedia.person),
        findPlace: sinon.stub().resolves(fixtures.dbpedia.place),
        findOrganization:sinon.stub().resolves(fixtures.dbpedia.organization),
        findTitle: sinon.stub().resolves(fixtures.dbpedia.title)
    }
}


function getEntitySourceStubs() {
    return {
        person: (new Map()).set('viaf', getViafStubs()).set('wikidata', getWikidataStubs()).set('getty',getGettyStubs()).set('dbpedia',getDbpediaStubs()),
        place: (new Map()).set('geonames', getGeonamesStubs()).set('viaf', getViafStubs()).set('wikidata', getWikidataStubs()).set('getty',getGettyStubs()).set('dbpedia',getDbpediaStubs()),
        organization: (new Map()).set('viaf', getViafStubs()).set('wikidata', getWikidataStubs()).set('dbpedia',getDbpediaStubs()),
        title: (new Map()).set('viaf', getViafStubs()).set('wikidata', getWikidataStubs()).set('dbpedia',getDbpediaStubs()),
    }
}


// test('popSearchPerson', (assert=>{testEntityType('person', popSearchPerson)}
async function testEntityType(assert, methodToTest, entityType, entitySourceMethod) {
    // 'ASSEMBLE'
    // doesModalExist(assert)
    let dialogsCopy = require('../src/index.js')
    let entitySources = getEntitySourceStubs();
    let queryOptions = getQueryOptionsWithCallbackSpy();
    dialogsCopy.registerEntitySources(entitySources)
    dialogsCopy.setEnabledSources(sourceEnabledData)

    // 'ACT'
    await dialogsCopy[methodToTest](queryOptions);
    // await new Promise(resolve => setTimeout(resolve, 100));

    // 'ASSERT
    entitySources[entityType].forEach((entitySource, entitySourceName) => {
        // assert.comment(entitySourceName)
        assert.ok(entitySource[entitySourceMethod].calledWith(queryOptions.query), 'called with query')
        assert.ok(entitySource[entitySourceMethod].calledOnce, 'called only once')

        assert.ok(isElementForIdVisible(`cwrc-${entitySourceName}-panel`), 'source panel is shown when it has a configured source')
        confirmShownTextMatchesFixtureTest(entitySourceName, entityType, assert);
    })

    assert.ok(isElementForIdVisible('cwrc-entity-lookup'), 'the modal was shown')

    const fixtureForSelectedResult = fixtures.wikidata[entityType][1]
    const elementForSelectedResult = document.getElementById('cwrc-wikidata-list').querySelectorAll('li')[1];

    // assert.comment('list visible: '+document.getElementById('cwrc-viaf-list').outerHTML)
    // assert.comment('selected el: '+elementForSelectedResult.outerHTML)

    testIFrame(assert, fixtureForSelectedResult, elementForSelectedResult)
    testSelection(assert, fixtureForSelectedResult, elementForSelectedResult, queryOptions)
    assert.end()
    // assert.comment('--- end ---')
}

function confirmShownTextMatchesFixtureTest(entitySourceName, entityType, assert) {
    document.getElementById(`cwrc-${entitySourceName}-list`).querySelectorAll('li').forEach((result, index) => {
        let fixtureResult = fixtures[entitySourceName][entityType][index];
        let textThatWasShown = result.getElementsByTagName('div')[0].textContent
        let textThatShouldHaveBeenShown = fixtureResult.description ?
            `${fixtureResult.name} - ${fixtureResult.description}` :
            `${fixtureResult.name}`
        assert.equals(textThatWasShown, textThatShouldHaveBeenShown, 'result text matches corresponding entity source result')
    })
}

function testIFrame(assert, fixtureForSelectedResult, elementForSelectedResult ) {

    // ACT: click on second result of viaf results
    $(elementForSelectedResult).click()

    // ASSERT
    let iframeLoading = document.getElementById("entity-iframe-loading");
    assert.ok(doesElementExist(iframeLoading), 'the iframe loader exists');
    // assert.ok(iframe.src.startsWith(fixtureForSelectedResult.uriForDisplay), 'the iframe src was set to the correct url')
    // xhr.restore();
    // await new Promise(resolve => setTimeout(resolve, 50));
    $(elementForSelectedResult).click() // click again to de-select
}

function testSelection(assert, fixtureForSelectedResult, elementForSelectedResult, queryOptions ) {
    $(elementForSelectedResult).click()
    $('#cwrc-entity-lookup-select').click()

    //await new Promise(resolve => setTimeout(resolve, 1000));
    assert.ok(isElementForIdHidden('cwrc-entity-lookup'), 'the modal was hidden')

    // ASSERT
    assert.ok(queryOptions.success.calledOnce)
    assert.ok(queryOptions.success.calledWith(fixtureForSelectedResult), 'the correct result was returned')
}

function isElementForIdVisible(elementId){
    return isElementVisible(document.getElementById(elementId))
}
function isElementForIdHidden(elementId){
    return isElementHidden(document.getElementById(elementId))
}
function isElementHidden(element) {
    // return element.offsetLeft < 0
    return ! isElementVisible(element)
}
function isElementVisible(element) {
    //return ! isElementHidden(element)
    return $(element).is(':visible')
}
function doesElementForIdExist(elementId) {
    return doesElementExist(document.getElementById(elementId))
}
function doesElementExist(element) {
    return $(element).length == 1;
}
function doesModalExist(assert) {
    let b = new Boolean(document.getElementById('cwrc-entity-lookup') !== null)
    assert.comment('doesModalExist: '+b.toString())
}


test('popSearchPerson',   function(assert){
    testEntityType(assert, 'popSearchPerson', 'person', 'findPerson')
})
test('popSearchPlace',  function(assert){
    testEntityType(assert, 'popSearchPlace','place', 'findPlace')
})
test('popSearchOrganization',   function(assert){
    testEntityType(assert, 'popSearchOrganization','organization', 'findOrganization');
})
test('popSearchTitle',   function(assert){
    testEntityType(assert, 'popSearchTitle','title', 'findTitle');
})

test('showNoLinkButton', async function(assert){
    let dialogsCopy = require('../src/index.js')
    let entitySources = getEntitySourceStubs();
    let queryOptions = getQueryOptionsWithCallbackSpy();
    dialogsCopy.registerEntitySources(entitySources)
    dialogsCopy.setEnabledSources(sourceEnabledData)

    dialogsCopy.showNoLinkButton(true)

    await dialogsCopy.popSearchPerson(queryOptions);

    assert.ok(isElementForIdVisible('cwrc-entity-lookup'), 'the modal was shown')

    assert.ok(isElementForIdVisible('cwrc-entity-lookup-nolink'), 'the no link button was shown')

    assert.end()
})

test('showCreateNewButton', async function(assert){
    let dialogsCopy = require('../src/index.js')
    let entitySources = getEntitySourceStubs();
    let queryOptions = getQueryOptionsWithCallbackSpy();
    dialogsCopy.registerEntitySources(entitySources)
    dialogsCopy.setEnabledSources(sourceEnabledData)

    dialogsCopy.showCreateNewButton(true)

    await dialogsCopy.popSearchPerson(queryOptions);

    assert.ok(isElementForIdVisible('cwrc-entity-lookup'), 'the modal was shown')

    assert.ok(isElementForIdVisible('cwrc-entity-lookup-new'), 'the create new button was shown')

    assert.end()
})

test('showEditButton', async function(assert){
    let dialogsCopy = require('../src/index.js')
    let entitySources = getEntitySourceStubs();
    let queryOptions = getQueryOptionsWithCallbackSpy();
    dialogsCopy.registerEntitySources(entitySources)
    dialogsCopy.setEnabledSources(sourceEnabledData)

    dialogsCopy.showEditButton(true)

    await dialogsCopy.popSearchPerson(queryOptions);

    assert.ok(isElementForIdVisible('cwrc-entity-lookup'), 'the modal was shown')

    assert.ok(isElementForIdVisible('cwrc-entity-lookup-edit'), 'the edit button was shown')

    assert.end()
})
