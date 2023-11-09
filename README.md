# Privileges ACL

**WIP: Do not use this library 'yet'.**

An access control library to manage and check user privileges. 
This library has been build to support roles and groups out of the box. 

Multiple storage mechanisms are supported or can easily be created. The Mongo 
and Meteor (Minimongo) storage are included by default.

## Getting started

```
npm install --save privileges
```

### Selecting a storage

```
import Privileges, {MongoStorage, MeteorStorage} from 'privileges';

// Using the mongodb storage
const MongoACL = new Privileges(MongoStorage);

// Using the Meteor storage
const MeteorACL = new Privileges(MeteorStorage);
```

### Granting and checking privileges
Simple checking
```
ACL.grant('chris', 'read');

// Simple check
ACL.can('chris', 'read'); // Returns true

//Support checking multiple privileges (OR)
ACL.can('chris', ['read', 'write']); // Returns true

// Failure scenario
ACL.can('chris', 'write'); // Returns false
```

Component scoped checking
```
ACL.grant('chris', 'read', 'userList');

// Simple check
ACL.can('chris', 'read', 'userList'); // Returns true

// Fail, because the privilege is scoped to a component
ACL.can('chris', 'read'); // Returns false
```


## Authors

* **Chris Visser** - *Creator* - [Github](https://github.com/Redroest)

See also the list of [contributors](https://github.com/your/project/contributors) who participated in this project.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
