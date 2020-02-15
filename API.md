# cwrc-public-entity-dialogs

<a name="module_cwrc-public-entity-dialogs"></a>

Module providing bootstrap dialogs for finding and selecting entities.

- [cwrc-public-entity-dialogs](#module_cwrc-public-entity-dialogs)
  - [.lookupSourceMetadata](#module_cwrc-public-entity-dialogs.lookupSourceMetadata)
  - [.registerEntitySources(sources)](#module_cwrc-public-entity-dialogs.registerEntitySources)
  - [.setEntityFormsRoot(url)](#module_cwrc-public-entity-dialogs.setEntityFormsRoot)
  - [.setCollectionsRoot(url)](#module_cwrc-public-entity-dialogs.setCollectionsRoot)
  - [.setShowCreateNewButton(value)](#module_cwrc-public-entity-dialogs.setShowCreateNewButton)
  - [.setShowEditButton(value)](#module_cwrc-public-entity-dialogs.setShowEditButton)
  - [.setShowNoLinkButton(value)](#module_cwrc-public-entity-dialogs.setShowNoLinkButton)
  - [.returnResult(result)](#module_cwrc-public-entity-dialogs.returnResult)
  - [.setEnabledSources(config)](#module_cwrc-public-entity-dialogs.setEnabledSources)
  - [.initialize(entityType, entityLookupMethodName, entityLookupTitle, searchOptions)](#module_cwrc-public-entity-dialogs.initialize)
  - [.popSearchPerson(searchOptions)](#module_cwrc-public-entity-dialogs.popSearchPerson)
  - [.popSearchPlace(searchOptions)](#module_cwrc-public-entity-dialogs.popSearchPlace)
  - [.popSearchOrganization(searchOptions)](#module_cwrc-public-entity-dialogs.popSearchOrganization)
  - [.popSearchTitle(searchOptions)](#module_cwrc-public-entity-dialogs.popSearchTitle)

<a name="module_cwrc-public-entity-dialogs.lookupSourceMetadata"></a>

## cwrc-public-entity-dialogs.lookupSourceMetadata

The list of possible entity lookup sources, their IDs, titles, and whether or not they're enabled.

**Kind**: static property of [`cwrc-public-entity-dialogs`](#module_cwrc-public-entity-dialogs)  
**Properties**

| Name     | Type     |
| -------- | -------- |
| cwrc     | `String` |
| viaf     | `String` |
| dbpedia  | `String` |
| geonames | `String` |
| getty    | `String` |
| wikidata | `String` |

<a name="module_cwrc-public-entity-dialogs.registerEntitySources"></a>

### cwrc-public-entity-dialogs.registerEntitySources(sources)

Register the entity lookup sources that will be used by this module.
The sources object should have keys which correspond to the 4 entity types.
The values of those keys should be Maps where the key is the lookup ID and the value is the lookup module.

**Kind**: static method of [`cwrc-public-entity-dialogs`](#module_cwrc-public-entity-dialogs)  
**See**: cwrc-public-entity-dialogs.lookupSourceMetadata

| Param   | Type     |
| ------- | -------- |
| sources | `Object` |

#### Example

```js
const viaf = require("viaf-entity-lookup");
const dbpedia = require("dbpedia-entity-lookup");
const sources = {
  person: new Map().set("viaf", viaf).set("dbpedia", dbpedia),
  place: new Map().set("viaf", viaf).set("dbpedia", dbpedia),
  organization: new Map().set("viaf", viaf).set("dbpedia", dbpedia),
  title: new Map().set("viaf", viaf).set("dbpedia", dbpedia)
};
```

<a name="module_cwrc-public-entity-dialogs.setEntityFormsRoot"></a>

### cwrc-public-entity-dialogs.setEntityFormsRoot(url)

Set the URL for where the [CWRC entity management forms](https://github.com/cwrc/cwrc-entity-management-forms-static) are located.
Currently only used by [Islandora CWRC Writer](https://github.com/cwrc/Islandora-CWRC-Writer).

**Kind**: static method of [`cwrc-public-entity-dialogs`](#module_cwrc-public-entity-dialogs)

| Param | Type     |
| ----- | -------- |
| url   | `String` |

<a name="module_cwrc-public-entity-dialogs.setCollectionsRoot"></a>

### cwrc-public-entity-dialogs.setCollectionsRoot(url)

Set the URL to use as the top level collection for create title entities.
Currently only used by [Islandora CWRC Writer](https://github.com/cwrc/Islandora-CWRC-Writer).

**Kind**: static method of [`cwrc-public-entity-dialogs`](#module_cwrc-public-entity-dialogs)  
**See**: 'cwrc-title-entity-dialog'

| Param | Type     |
| ----- | -------- |
| url   | `String` |

<a name="module_cwrc-public-entity-dialogs.setShowCreateNewButton"></a>

### cwrc-public-entity-dialogs.setShowCreateNewButton(value)

Whether to show the Create New button, used to spawn the [CWRC entity management forms](https://github.com/cwrc/cwrc-entity-management-forms-static).
Currently only used by [Islandora CWRC Writer](https://github.com/cwrc/Islandora-CWRC-Writer).

**Kind**: static method of [`cwrc-public-entity-dialogs`](#module_cwrc-public-entity-dialogs)

| Param | Type      |
| ----- | --------- |
| value | `Boolean` |

<a name="module_cwrc-public-entity-dialogs.setShowEditButton"></a>

### cwrc-public-entity-dialogs.setShowEditButton(value)

Whether to show the Edit Selected button, used to spawn the [CWRC entity management forms](https://github.com/cwrc/cwrc-entity-management-forms-static).
Currently only used by [Islandora CWRC Writer](https://github.com/cwrc/Islandora-CWRC-Writer).

**Kind**: static method of [`cwrc-public-entity-dialogs`](#module_cwrc-public-entity-dialogs)

| Param | Type      |
| ----- | --------- |
| value | `Boolean` |

<a name="module_cwrc-public-entity-dialogs.setShowNoLinkButton"></a>

### cwrc-public-entity-dialogs.setShowNoLinkButton(value)

Whether to show the Tag Without Linking button, which allows the user to skip this dialog in the entity tagging process.

**Kind**: static method of [`cwrc-public-entity-dialogs`](#module_cwrc-public-entity-dialogs)

| Param | Type      |
| ----- | --------- |
| value | `Boolean` |

<a name="module_cwrc-public-entity-dialogs.returnResult"></a>

### cwrc-public-entity-dialogs.returnResult(result)

Call the success method specified in searchOptions with the entity lookup result.

**Kind**: static method of [`cwrc-public-entity-dialogs`](#module_cwrc-public-entity-dialogs)  
**Access**: protected

| Param             | Type     | Description                          |
| ----------------- | -------- | ------------------------------------ |
| result            | `Object` | The entity lookup result             |
| result.uri        | `String` | The entity URI                       |
| result.name       | `String` | The entity name/lemma                |
| result.repository | `String` | The name of the entity lookup source |

<a name="module_cwrc-public-entity-dialogs.setEnabledSources"></a>

### cwrc-public-entity-dialogs.setEnabledSources(config)

Set which entity lookup sources are enabled, i.e. available to the user.

**Kind**: static method of [`cwrc-public-entity-dialogs`](#module_cwrc-public-entity-dialogs)

| Param  | Type     |
| ------ | -------- |
| config | `Object` |

#### Example

```js
{'viaf': true, 'wikidata': true, 'getty': true, 'dbpedia': true, 'geonames': true}
```

<a name="module_cwrc-public-entity-dialogs.initialize"></a>

### cwrc-public-entity-dialogs.initialize(entityType, entityLookupMethodName, entityLookupTitle, searchOptions)

Initialize and display an entity lookup dialog.

**Kind**: static method of [`cwrc-public-entity-dialogs`](#module_cwrc-public-entity-dialogs)  
**Access**: protected

| Param                    | Type       | Default         | Description                                                                             |
| ------------------------ | ---------- | --------------- | --------------------------------------------------------------------------------------- |
| entityType               | `String`   |                 | The entity type                                                                         |
| entityLookupMethodName   | `String`   |                 | The name of the method to call on the lookup module                                     |
| entityLookupTitle        | `String`   |                 | The dialog title                                                                        |
| searchOptions            | `Object`   |                 | The search options                                                                      |
| searchOptions.query      | `String`   |                 | The search query                                                                        |
| searchOptions.success    | `function` |                 | The function to call with the entity the user selected, see returnResult for the format |
| searchOptions.cancelled  | `function` |                 | The function to call if the user cancelled the dialog                                   |
| [searchOptions.parentEl] | `Element`  | `document.body` | The element to append the dialog to                                                     |
| [searchOptions.uri]      | `String`   |                 | The entity URI, if editing                                                              |
| [searchOptions.name]     | `String`   |                 | The entity name/lemma, if editing                                                       |

<a name="module_cwrc-public-entity-dialogs.popSearchPerson"></a>

### cwrc-public-entity-dialogs.popSearchPerson(searchOptions)

Open a person entity lookup dialog.

**Kind**: static method of [`cwrc-public-entity-dialogs`](#module_cwrc-public-entity-dialogs)  
**See**: cwrc-public-entity-dialogs.initialize

| Param         | Type     |
| ------------- | -------- |
| searchOptions | `Object` |

<a name="module_cwrc-public-entity-dialogs.popSearchPlace"></a>

### cwrc-public-entity-dialogs.popSearchPlace(searchOptions)

Open a place entity lookup dialog.

**Kind**: static method of [`cwrc-public-entity-dialogs`](#module_cwrc-public-entity-dialogs)  
**See**: cwrc-public-entity-dialogs.initialize

| Param         | Type     |
| ------------- | -------- |
| searchOptions | `Object` |

<a name="module_cwrc-public-entity-dialogs.popSearchOrganization"></a>

### cwrc-public-entity-dialogs.popSearchOrganization(searchOptions)

Open a organization entity lookup dialog.

**Kind**: static method of [`cwrc-public-entity-dialogs`](#module_cwrc-public-entity-dialogs)  
**See**: cwrc-public-entity-dialogs.initialize

| Param         | Type     |
| ------------- | -------- |
| searchOptions | `Object` |

<a name="module_cwrc-public-entity-dialogs.popSearchTitle"></a>

### cwrc-public-entity-dialogs.popSearchTitle(searchOptions)

Open a title entity lookup dialog.

**Kind**: static method of [`cwrc-public-entity-dialogs`](#module_cwrc-public-entity-dialogs)  
**See**: cwrc-public-entity-dialogs.initialize

| Param         | Type     |
| ------------- | -------- |
| searchOptions | `Object` |
