# CWRC-PublicEntityDialogs

![Picture](http://cwrc.ca/logos/CWRC_logos_2016_versions/CWRCLogo-Horz-FullColour.png)

[![Travis](https://img.shields.io/travis/cwrc/CWRC-PublicEntityDialogs.svg)](https://travis-ci.org/cwrc/CWRC-PublicEntityDialogs)
[![Codecov](https://img.shields.io/codecov/c/github/cwrc/CWRC-PublicEntityDialogs.svg)](https://codecov.io/gh/cwrc/CWRC-PublicEntityDialogs)
[![version](https://img.shields.io/npm/v/cwrc-public-entity-dialogs.svg)](http://npm.im/cwrc-public-entity-dialogs)
[![downloads](https://img.shields.io/npm/dm/cwrc-public-entity-dialogs.svg)](http://npm-stat.com/charts.html?package=cwrc-public-entity-dialogs&from=2015-08-01)
[![GPL-2.0](https://img.shields.io/npm/l/cwrc-public-entity-dialogs.svg)](http://opensource.org/licenses/GPL-2.0)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![experimental](http://badges.github.io/stability-badges/dist/experimental.svg)](http://github.com/badges/stability-badges)

1. [Overview](#overview)
1. [Installation](#installation)
1. [Use](#use)
1. [API](#api)
1. [Development](#development)

## Overview

The CWRC-PublicEntityDialogs are used with the [CWRC-WriterBase](https://github.com/cwrc/CWRC-WriterBase) to lookup entities (people, places, organizations, and titles) in various public name authority files (e.g. VIAF) or databases (e.g. Wikidata). The dialogs only provide public lookup. Creation/editing/deletion of entities should be made outside of the CWRC-Writer in the name authority itself.

The currently available entity lookup sources are:

- [dbpedia-entity-lookup](https://github.com/cwrc/dbpedia-entity-lookup)
- [geonames-entity-lookup](https://github.com/cwrc/geonames-entity-lookup)
- [getty-entity-lookup](https://github.com/cwrc/getty-entity-lookup)
- [lgpn-entity-lookup](https://github.com/cwrc/lgpn-entity-lookup)
- [viaf-entity-lookup](https://github.com/cwrc/viaf-entity-lookup)
- [wikidata-entity-lookup](https://github.com/cwrc/wikidata-entity-lookup)

## Installation

`npm install cwrc-public-entity-dialogs`

## Use

The dialogs must be configured with entity lookup sources, using the registerEntitySources method. They are then passed to the CWRC-WriterBase.

```js
const EntityLookupDialogs = require("cwrc-public-entity-dialogs");

const viaf = require("viaf-entity-lookup");
const dbpedia = require("dbpedia-entity-lookup");

EntityLookupDialogs.registerEntitySources({
  person: new Map().set("viaf", viaf).set("dbpedia", dbpedia),
  place: new Map().set("viaf", viaf).set("dbpedia", dbpedia),
  organization: new Map().set("viaf", viaf).set("dbpedia", dbpedia),
  title: new Map().set("viaf", viaf).set("dbpedia", dbpedia)
});

const CWRCWriter = require("cwrc-writer-base");
const writer = new CWRCWriter({
  entityLookupDialogs: EntityLookupDialogs
});
```

## API

[View the full API here](https://github.com/cwrc/CWRC-PublicEntityDialogs/blob/master/API.md)

## Development

[CWRC-Writer-Dev-Docs](https://github.com/cwrc/CWRC-Writer-Dev-Docs) explains how to work with CWRC-Writer GitHub repositories, including this one.
