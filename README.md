![Picture](http://cwrc.ca/logos/CWRC_logos_2016_versions/CWRCLogo-Horz-FullColour.png)

[![Travis](https://img.shields.io/travis/cwrc/CWRC-PublicEntityDialogs.svg)](https://travis-ci.org/cwrc/CWRC-PublicEntityDialogs)
[![Codecov](https://img.shields.io/codecov/c/github/cwrc/CWRC-PublicEntityDialogs.svg)](https://codecov.io/gh/cwrc/CWRC-PublicEntityDialogs)
[![version](https://img.shields.io/npm/v/cwrc-public-entity-dialogs.svg)](http://npm.im/cwrc-public-entity-dialogs)
[![downloads](https://img.shields.io/npm/dm/cwrc-public-entity-dialogs.svg)](http://npm-stat.com/charts.html?package=cwrc-public-entity-dialogs&from=2015-08-01)
[![GPL-2.0](https://img.shields.io/npm/l/cwrc-public-entity-dialogs.svg)](http://opensource.org/licenses/GPL-2.0)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![experimental](http://badges.github.io/stability-badges/dist/experimental.svg)](http://github.com/badges/stability-badges)

# CWRC-PublicEntityDialogs

1. [Overview](#overview)
1. [Installation](#installation)
1. [Use](#use)
1. [API](#api)
1. [Development](#development)

### Overview

The CWRC-PublicEntityDialogs are used with the [CWRC-Writer](https://github.com/cwrc/CWRC-Writer) to lookup entities (people, places, organizations, and places) in VIAF.  The dialogs only provide public lookup.  Creation/editing/deletion of entities should be made outside of the CWRC-Writer in the name authority itself.

### Installation

npm i cwrc-publi-entity-dialogs -S

### Use

let entityDialogs = require('cwrc-publi-entity-dialogs');

### API

The following methods open bootstrap dialogs:


###### popSearchPerson(options)

###### popSearchOrganization(options)

###### popSearchPlace(options)

###### popSearchTitle(options)
  
where 'options' is an object with three properties:

```
{
    query:  The query string supplied by the end user.   
    success: A callback that takes one argument, an object holding the result of the lookup, defined below.
    cancelled: A callback with no arguments, to notify the CWRC-Writer that the entity lookup was cancelled.
}
```

The object returned in the `success` callback is:

```
{   
    name: a string - the name of the entity to display,
    uri: uri to be used as the Linked Data URI for the entity,
    id: same as uri,
    repository: the name of the authority in which the result was found, e.g., 'viaf'
}
```
-----

### Development

development.html is provided along with browserify and watch scripts in the package.json to allow working with the dialogs in a local browser.

[CWRC-Writer-Dev-Docs](https://github.com/jchartrand/CWRC-Writer-Dev-Docs) explains how to work with CWRC-Writer GitHub repositories, including this one.


