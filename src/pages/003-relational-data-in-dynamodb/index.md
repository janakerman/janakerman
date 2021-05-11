---
title: Relational Data In DynamoDB
date: "2019-03-20"
tags: ['AWS', 'DynamoDB']
---

If you’ve got relational data, then there is a fair argument that you should use a relational database. However, there’s still a lot of good reasons to use a NoSQL store like DynamoDB:

- Very quick set up
- 'Infinitely' scalable out the box
- Redundant over 3 Availability Zones
- Pay for what you use
- Completely Serverless - no maintenance windows
- Security handled by AWS IAM
- No need to define a schema (sort of)

## DynamoDB Concepts

DynamoDB requires you to set up a `Primary Index` for a table, called the `HASH` and optionally a sort key called the `RANGE`.

Documents are grouped onto partitions by their `HASH` key. Additionally, documents are stored in order with an optional `RANGE` key. You can think of each unique `HASH` as being its own conceptual table within the table. You can query for everything for a given `HASH` key, and if you specified a `RANGE` key, we can query for specific values or ranges of values.

Queries over any other attributes of a document require a full table scan which will become slower the larger your table gets.

DynamoDB also allows you to define additional indexes over your table.

## The Domain

I am creating a simple serverless application so that devs in the Scott Logic London office could order their breakfast for our weekly technical breakfasts.

I highlighted the following entities:

**Breakfast** - an event for which devs can order breakfast.

**Order** - a dev’s breakfast.

**Item** - An order is for an item, and an office has a list of possible items.

**Dev** - a hungry dev.

A _Breakfast_ has many _Orders_, which has _Items_, which is made by a _Dev_. Simple.

With an SQL database, you model your tables on your relationships (which are usually fairly easy to understand). Following that you can flexibly query your data for _most_ use cases (DBAs will be screaming here, I know it isn't that simple).

NoSQL databases give you a lot of luxuries, but not that. To store relational data in a database you need to understand your access patterns up front. I created a requirements table for my simple domain highlighting what queries are needed. Throughout this post, we're going to be referring back to these requirements as we make them possible.

1. **Get a Breakfast by ID**
1. **Get all Items**
1. **Get all Breakfasts**
1. **Get all Orders for a Breakfast**
1. **Get all Orders for a User**
1. **Get all Breakfasts between a certain date**

There is also a constraint I want to enforce:
1. **There can only be one breakfast on a given day**

## Retrieving Entities

So we've got four entities: _Breakfast_, _Order, _Item_, and _Dev_. To fulfil requirements #1 and #2, we need to be able to access entities by their ID. To do this, I could put all of the entities in their table with unique columns names like so:

|BreakfastId |ItemId|OrderId|UserId    |Name          | Date     | Item |(...Additional Columns)|
|-----------:|-----:|------:|---------:|-------------:|---------:|-----:|----------------------:|
|           1|      |       |          |              |2019-04-29|      | ...                   |
|            |    11|       |          |Bacon Sandwich|          |      | ...                   |
|            |      |   0001|          |              |          |Item-1| ...                   |
|            |      |       |janakerman|Jan Akerman   |          |      | ...                   |

Since the entities have different attributes, this would require the creation of a Global Secondary Index (GSI) for every single entity.

Whilst AWS's soft limit of 20GSIs per table means that this is a feasible approach for a lot of applications, it gets difficult as the complexity of your service increases. Also, there is additional storage and provisioned capacity costs for each index. We can be a little more efficient than that.

Instead, we can "overload" the `Primary Index` by creating two more generic columns: a `HASH` key named `PartitionKey` and a `RANGE` key called `SortKey`. The name of the index attributes no longer reflect the attribute's content. At the downside of less intuitive attribute names, we gain the ability to use a single index for all our entity access.

Look at our new `Primary Index` represented by the table below.

### Primary Index (visualisation)
|PartitionKey (PI-HASH)|SortKey (PI-SORT)|(...Additional Columns)
|-----:|---:|----:|
|1|BREAKFAST|...|
|11|ITEM|...|
|0001|ORDER|...|
|janakerman|USER|...|


> **#1 Get a Breakfast by ID** - Querying the `Primary Index` by the breakfast ID will return the individual breakfast record.

# A Global Secondary Index

The next access pattern we are going to solve is the ability to get all entities of a given type.

In a relational database, records are categorised into respective tables, but since our NoSQL table structure is a mashup of different entities we need to approach this in a different way.

At the moment, it isn't possible to query the above `Primary Index` for anything other than entity IDs. You may have noticed in the above examples that we have stored a String representing the entity type in the `SortKey` column. This was intentional! By creating an additional `Global Secondary Index` (`GSI`) with a `HASH` on the `SortKey` column, it is now possible to query for specific entities by querying for their type.


### Global Secondary Index (visualisation)
|SortKey (GSI HASH)|Partition Key |(...Additional Columns)
|-----:|----:|---:|
|BREAKFAST|1|...|
|ITEM|11|...|
|ORDER|001|...|
|USER|janakerman|...|

We've now completed two more of the application's read requirements.

> **#2 Get all breakfast Items** - Querying the `GSI` with the value `ITEM` will return all of the Item entities.

> **#3 Get all Breakfasts** - Querying the `GSI` with the value `BREAKFAST` will return all breakfasts.

## Adding Relationships

Here we're going to use a pattern called the "Adjacency List Pattern" to model our relational data. The core idea is that we model our relations as a graph, with a document entry for each node (entity) and edge (relationship). Let's take the relationship between the Breakfast entity and the Order entity. As defined above, we have a one to many relationships here, each Breakfast can have many Orders.

We've already got records for all of our entities, so let's add records for our relationship. Let's also add a prefix to our identifiers.

| PartitionKey (PI-HASH) | SortKey (PI-SORT, GSI-HASH) | (...Additional Fields)
|---|---|---|
|BREAKFAST-1  |BREAKFAST|...|
|BREAKFAST-2  |BREAKFAST|...|
|**BREAKFAST-1**  |**ORDER-0001**|...|
|**BREAKFAST-1**  |**ORDER-0002**|...|
|ORDER-0001| USER-janakerman|...|
|ORDER-0002| USER-hungrydev|...|
|USER-janakerman|Jan Akerman|...|
|USER-hungrydev|Hungry Dev|...|

As you can see, to add an Order for a Breakfast, we've added a record representing the relationship under the `HASH` of the Breakfast the Order belongs to.

This allows us to query the `Primary Index` for all records with a `PartitionKey` (`HASH`) of `BREAKFAST-1`. This will return us the Breakfast entity and all of its relationships. We can efficiently filter this by querying with a **starts with* `ORDER-` condition on our `SortKey` (`RANGE`). This will return us all Orders for the Breakfast, without the Breakfast entity itself.

We've now fulfilled our two more requirements.

> **4. Get all Orders for a Breakfast** - Querying the `Primary Index` `HASH` for the Breakfast ID, and filtering the `Sort Key` for records that begin with `ORDER-`.


> **5. Get all Orders for a User** - Querying the `GSI` `HASH` for all records containing `USER-janakerman`.

## Extending the GSI for RANGE Queries

If we extend our `GSI` to use a 'composite key' (an index using a `HASH` and a `RANGE`), by indexing an additional generic `Data` attribute, we can add another dimension of queries. This allows us to populate the Breakfast's date in the `Data` attribute, and query it within a range.

### Primary Index (representation)

Here is what the table looks like from the perspective of our `Primary Index`.

| PartitionKey (PI-HASH) | SortKey (PI-SORT) | Data         |(...Additional Fields)|
|------------------------|-------------------|--------------|----------------------|
|BREAKFAST-1             |**BREAKFAST**      |**2019-04-22**|                      |
|BREAKFAST-2             |**BREAKFAST**      |**2019-04-29**|                      |
|BREAKFAST-1             |ORDER-0001         |              |                      |
|BREAKFAST-1             |ORDER-0002         |              |                      |
|...                     |                   |              |                      |

Here is what our table now looks like from the perspective of our `GSI`:

### Global Secondary Index (representation)
| SortKey (GSI-HASH) | Data (GSI-RANGE) | PartitionKey|(...Additional Fields)|
|--------------------|------------------|-------------|----------------------|
|**BREAKFAST**       |**2019-04-22**    |BREAKFAST-1  |                      |
|**BREAKFAST**       |**2019-04-29**    |BREAKFAST-2  |                      |
|...                 |                  |             |                      |

Notice that the two Order entries would be ignored in this index as they do not have a Data column value.

We can now query our `GSI` for the `HASH` of `BREAKFAST` to get all breakfasts and provide a date range on our `RANGE` key to get breakfasts between two dates.

> **#6 Get all Breakfasts between a certain date** - Query the `GSI` for the `HASH` of `BREAKFAST` and a `RANGE` between two date values.

## The Constraints

There is still a constraint that we’ve yet to apply to the table.

> 1. **There can only be one breakfast on a given day**

The only constraint that DynamoDB gives us is that there can only be a single record for a given index key (`HASH` or `HASH` and `RANGE` if composite). We can be clever with our entity keys to enforce unique constraints on certain data values.

For the above constraint, if we add the breakfast date to the Breakfast entities ID, we can ensure that there can never exist two breakfasts for a given date.

| PartitionKey (HASH) | SortKey (PI-SORT, GSI-HASH) | Data (GSI-RANGE) |(...Additional Fields)|
|---------------------|-----------------------------|------------------|----------------------|
|BREAKFAST-2019-04-22 |**BREAKFAST**                |**2019-04-22**    |                      |
|BREAKFAST-2019-04-29 |**BREAKFAST**                |**2019-04-29**    |                      |
|...                  |                             |                  |                      |

If we try to add an additional breakfast entry on `2019-04-22` or `2019-04-29`, we'll just update the record in question. If we want to ensure we don't overwrite existing records we can also use DynamoDB's API `put` a new record if no entry already exists.

## Summary

This post has demonstrated a technique for modelling relational data in DynamoDB. Whilst this DynamoDB table technically has no schema, there is most definitely an implied schema. You can see that even in this simple domain that the table isn't particularly human readable, so without proper documentation things can get quite hard to understand. Additionally, you will undoubtedly be pushing some of the relational logic into your app layer when creating entities, so make sure you **abstract** this from your business logic.

Using DynamoDB has some amazing benefits and can really get you up and running with a production-ready database in a short space of time. Whether this works long term for your application is really a call you'll have to make.

As always, **abstract** the database code from your business code, and be pragmatic - don't be afraid to iterate quickly and throw things away when they don't work anymore!

Checkout this [GitHub](https://github.com/janakerman/blog-relational-dynamo) project and follow the instructions in the README.md to create a CloudFormation stack seeded with the data structure described in this post.
