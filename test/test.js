'use strict';

let $ = require('jquery');
window.jQuery = window.cwrcQuery = $;
require('bootstrap');

// needed for jquery is(':visible') to work in jsdom, from: https://github.com/jsdom/jsdom/issues/1048#issuecomment-401599392
window.Element.prototype.getClientRects = function() {
    var node = this;
    while(node) {
        if(node === document) {
            break;
        }
        // don't know why but style is sometimes undefined
        if (!node.style || node.style.display === 'none' || node.style.visibility === 'hidden') {
            return [];
        }
        node = node.parentNode;
    }
     var self = $(this);
    return [{width: self.width(), height: self.height()}];
};

jest.mock('broadcast-channel');

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
        findPlace: () => { return Promise.resolve(fixtures.geonames.place); }
    }
}

function getViafStubs() {
    return {
        findPerson: () => { return Promise.resolve(fixtures.viaf.person); },
        findPlace: () => { return Promise.resolve(fixtures.viaf.place); },
        findOrganization: () => { return Promise.resolve(fixtures.viaf.organization); },
        findTitle: () => { return Promise.resolve(fixtures.viaf.title); },
        findRS: () => { return Promise.resolve(fixtures.viaf.rs); }
    }
}

function getWikidataStubs() {
    return {
        findPerson: () => { return Promise.resolve(fixtures.wikidata.person); },
        findPlace: () => { return Promise.resolve(fixtures.wikidata.place); },
        findOrganization: () => { return Promise.resolve(fixtures.wikidata.organization); },
        findTitle: () => { return Promise.resolve(fixtures.wikidata.title); }
    }
}

function getGettyStubs() {
    return {
        findPerson: () => { return Promise.resolve(fixtures.getty.person); },
        findPlace: () => { return Promise.resolve(fixtures.getty.place); }
    }
}

function getDbpediaStubs() {
    return {
        findPerson: () => { return Promise.resolve(fixtures.dbpedia.person); },
        findPlace: () => { return Promise.resolve(fixtures.dbpedia.place); },
        findOrganization: () => { return Promise.resolve(fixtures.dbpedia.organization); },
        findTitle: () => { return Promise.resolve(fixtures.dbpedia.title); }
    }
}

function getEntitySourceStubs() {
    return {
        person: (new Map()).set('viaf', getViafStubs()).set('wikidata', getWikidataStubs()),//.set('getty',getGettyStubs()).set('dbpedia',getDbpediaStubs()),
        place: (new Map()).set('geonames', getGeonamesStubs()).set('viaf', getViafStubs()).set('wikidata', getWikidataStubs()).set('getty', getGettyStubs()).set('dbpedia', getDbpediaStubs()),
        organization: (new Map()).set('viaf', getViafStubs()).set('wikidata', getWikidataStubs()).set('dbpedia', getDbpediaStubs()),
        title: (new Map()).set('viaf', getViafStubs()).set('wikidata', getWikidataStubs()).set('dbpedia', getDbpediaStubs()),
        rs: (new Map()).set('viaf', getViafStubs())
    }
}

function testEntityType(methodToTest, entityType, entitySourceMethod) {
    expect.assertions(11);

    const queryOptions = {
        query: 'jones',
        success: (results) => {}
    };

    const spy = jest.spyOn(queryOptions, 'success');

    return new Promise((resolve, reject) => {
        let dialogsCopy = require('../src/index.js')
        let entitySources = getEntitySourceStubs();
        dialogsCopy.registerEntitySources(entitySources)
        dialogsCopy.setEnabledSources(sourceEnabledData)

        dialogsCopy.init();

        $('#cwrc-entity-lookup').on('shown.bs.modal', () => {
            expect(isElementForIdVisible('cwrc-entity-lookup')).toBe(true);

            setTimeout(async () => {
                entitySources[entityType].forEach((entitySource, entitySourceName) => {
                    expect(isElementForIdVisible(`cwrc-${entitySourceName}-panel`)).toBe(true);
                    confirmShownTextMatchesFixtureTest(entitySourceName, entityType);
                })

                const fixtureForSelectedResult = fixtures.wikidata[entityType][1]
                const elementForSelectedResult = document.getElementById('cwrc-wikidata-list').querySelectorAll('li')[1];

                await testIFrame(fixtureForSelectedResult, elementForSelectedResult)
                testSelection(fixtureForSelectedResult, elementForSelectedResult, queryOptions)

                expect(spy).toHaveBeenCalled();

                spy.mockRestore();

                resolve();
            }, 50);
        });

        dialogsCopy[methodToTest](queryOptions);
    });
}

function confirmShownTextMatchesFixtureTest(entitySourceName, entityType) {
    document.getElementById(`cwrc-${entitySourceName}-list`).querySelectorAll('li').forEach((result, index) => {
        let fixtureResult = fixtures[entitySourceName][entityType][index];
        let textThatWasShown = result.getElementsByTagName('div')[0].textContent
        let textThatShouldHaveBeenShown = fixtureResult.description ?
            `${fixtureResult.name} - ${fixtureResult.description}` :
            `${fixtureResult.name}`
        expect(textThatWasShown).toBe(textThatShouldHaveBeenShown);
    })
}

function testIFrame(fixtureForSelectedResult, elementForSelectedResult) {
    return new Promise((resolve, reject) => {
        $(elementForSelectedResult).on('shown.bs.popover', () => {
            let iframeLoading = document.getElementById("entity-iframe-loading");
            expect(doesElementExist(iframeLoading)).toBe(true);
            
            let iframe = document.getElementById('entity-iframe');
            expect(iframe.src.startsWith(fixtureForSelectedResult.uriForDisplay)).toBe(true);
            
            $(elementForSelectedResult).click() // click again to de-select

            resolve();
        })

        $(elementForSelectedResult).click()
    });
}

function testSelection(fixtureForSelectedResult, elementForSelectedResult) {
    $(elementForSelectedResult).click()
    $('#cwrc-entity-lookup-select').click()

    expect(isElementForIdHidden('cwrc-entity-lookup')).toBe(true);
}

test('popSearchPerson', () => {
    return testEntityType('popSearchPerson', 'person', 'findPerson');
})
// test('popSearchPlace', function(assert){
//     return testEntityType('popSearchPlace','place', 'findPlace')
// })
// test('popSearchOrganization',   function(assert){
//     return testEntityType('popSearchOrganization','organization', 'findOrganization');
// })
// test('popSearchTitle',   function(assert){
//     return testEntityType('popSearchTitle','title', 'findTitle');
// })

test('showNoLinkButton', () => {
    expect.assertions(1);

    let dialogsCopy = require('../src/index.js')
    let entitySources = getEntitySourceStubs();
    dialogsCopy.registerEntitySources(entitySources)
    dialogsCopy.setEnabledSources(sourceEnabledData)

    dialogsCopy.showNoLinkButton(true)

    dialogsCopy.popSearchPerson({
        query: 'jones',
        success: (results) => {}
    });

    expect($('#cwrc-entity-lookup-nolink').length).toBe(1);
})

test('showCreateNewButton', () => {
    expect.assertions(1);

    let dialogsCopy = require('../src/index.js')
    let entitySources = getEntitySourceStubs();
    dialogsCopy.registerEntitySources(entitySources)
    dialogsCopy.setEnabledSources(sourceEnabledData)

    dialogsCopy.showNoLinkButton(true)

    dialogsCopy.popSearchPerson({
        query: 'jones',
        success: (results) => {}
    });

    expect($('#cwrc-entity-lookup-new').length).toBe(1);
})

test('showEditButton', () => {
    expect.assertions(1);

    let dialogsCopy = require('../src/index.js')
    let entitySources = getEntitySourceStubs();
    dialogsCopy.registerEntitySources(entitySources)
    dialogsCopy.setEnabledSources(sourceEnabledData)

    dialogsCopy.showNoLinkButton(true)

    dialogsCopy.popSearchPerson({
        query: 'jones',
        success: (results) => {}
    });

    expect($('#cwrc-entity-lookup-edit').length).toBe(1);
})

function isElementForIdVisible(elementId) {
    return isElementVisible(document.getElementById(elementId))
}
function isElementForIdHidden(elementId) {
    return isElementHidden(document.getElementById(elementId))
}
function isElementHidden(element) {
    return !isElementVisible(element)
}
function isElementVisible(element) {
    return $(element).is(':visible')
}
function doesElementForIdExist(elementId) {
    return doesElementExist(document.getElementById(elementId))
}
function doesElementExist(element) {
    return $(element).length == 1;
}
