![Picture](http://www.cwrc.ca/wp-content/uploads/2010/12/CWRC_Dec-2-10_smaller.png)

[![Travis](https://img.shields.io/travis/jchartrand/CWRC-PublicEntityDialogs.svg)](https://travis-ci.org/jchartrand/CWRC-PublicEntityDialogs)
[![version](https://img.shields.io/npm/v/cwrc-public-entity-dialogs.svg)](http://npm.im/cwrc-public-entity-dialogs)
[![downloads](https://img.shields.io/npm/dm/cwrc-public-entity-dialogs.svg)](http://npm-stat.com/charts.html?package=cwrc-public-entity-dialogs&from=2015-08-01)
[![GPL-2.0](https://img.shields.io/npm/l/cwrc-public-entity-dialogs.svg)](http://opensource.org/licenses/GPL-2.0)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)


# CWRC-PublicEntityDialogs

1. [Overview](#overview)
1. [Installation](#installation)
1. [Use](#use)
1. [API](#api)
1. [Development](#development)

### Overview

The CWRC-PublicEntityDialogs are used with the [CWRC-Writer](https://github.com/cwrc/CWRC-Writer) to lookup entities (people, places, organizations, and places) in VIAF.  This version of the dialogs provides only public lookup.  The version at [CWRC-Dialogs](https://github.com/cwrc/CWRC-Dialogs) also allows editing and creating entities in the CWRC entity system.

### Installation

npm i cwrc-publi-entity-dialogs

### Use

let entityDialogs = require('cwrc-publi-entity-dialogs');

### API

The following methods are supported in this read only version of the dialogs:

popSearchPerson
popSearchOrganization
popSearchPlace
popSearchTitle

popSearch: {
        person : popSearchPerson,
        organization : popSearchOrganization,
        place : popSearchPlace,
        title : popSearchTitle}

The following methods are included for compatability.  They spawn a popup saying the given feature isn't available:

initialize
initializeWithCookieData
initializeWithLogin
    
popCreatePerson
popCreateOrganization
popCreatePlace
popCreateTitle

popCreate: {
    person: popCreatePerson, 
    organization: popCreateOrganization, 
    place: popCreatePlace, 
    title: popCreateTitle }

popEdit: {
    person : popEditPerson,
    organization : popEditOrganization,
    place : popEditPlace,
    title : popEditTitle }

setCwrcApi
setRepositoryBaseObjectURL
setGeonameUrl
setGoogleGeocodeUrl
setViafUrl
setPersonSchema
setOrganizationSchema
setPlaceSchema

### Development

An index.html is provided along with a browserify/watchify script in the package.json to allow working with the dialogs in a local browser.


