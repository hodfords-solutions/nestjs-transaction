<p align="center">
  <a href="http://opensource.hodfords.uk" target="blank"><img src="https://opensource.hodfords.uk/img/logo.svg" width="320" alt="Hodfords Logo" /></a>
</p>

<p align="center"> <b>nestjs-transaction</b> makes managing database transactions in NestJS easy and straightforward. It provides simple tools to start, commit, and roll back transactions, helping you ensure that multiple database operations are completed successfully or not at all. With `nestjs-transaction`, you can handle complex transaction scenarios with ease, making your data handling more reliable and error-free. </p>

## Installation 🤖

Install the `nestjs-transaction` package with:

```ts
npm install @hodfords/nestjs-transaction --save
```

## Usage 🚀

First, you need to import the `TransactionModule` into your `AppModule` and 

```typescript
import { Module } from '@nestjs/common';
import { TransactionModule } from '@hodfords/nestjs-transaction';

@Module({
    imports: [
        TransactionModule.forRoot({
            autoUseMasterNodeForChangeRequest: true
        }),
        // other modules
    ],
    controllers: [],
    providers: [],
})
export class AppModule {}
```
#### Optional Configuration
You can configure the `TransactionModule` with the following options:
- `autoUseMasterNodeForChangeRequest`: If set to `true`, the module will automatically use the master node for change requests (except GET). This is useful for ensuring that write operations are always directed to the correct database node.

### How to use

#### Transactional

You can use the `@Transactional` decorator to mark a method as transactional. This means that all database operations within this method and child methods will be executed within a transaction context. If any operation fails, the entire transaction will be rolled back, ensuring data integrity.

In any service, you can use the `@Transactional` decorator to ensure that the method is executed within a transaction context:

> **Note**: We suggest using the `@Transactional` decorator on Controller/Task/Cron jobs methods, as it will automatically handle the transaction lifecycle for you. However, you can also use it in services if needed.

```typescript
@Transactional()
async myTransactionalMethod() {
    await this.myRepository.save(myEntity);
}
```

In controllers, you can also use the `@Transactional` decorator to ensure that the entire request is wrapped in a transaction:
```typescript

import { Controller, Post } from '@nestjs/common';
import { Transactional } from '@hodfords/nestjs-transaction';
import { MyService } from './my.service';

@Controller('my')
export class MyController {
    constructor(private myService: MyService) {}
    
    @Post('create')
    @Transactional()
    async create() {
        return this.myService.create();
    }
}
```

You also use the `@Transactional` decorator with options to control the transaction behavior, such as isolation level. For example:

```typescript
@Transactional({ isolationLevel: 'SERIALIZABLE'})
async myTransactionalMethod() {
    // This method will run in a transaction with SERIALIZABLE isolation level
    await this.myRepository.save(myEntity);
}
```

#### Replication
You can use the `@UseMasterNode`/`@UseSlaveNode` decorator to ensure that a method is executed on the master/slave node. This is useful for write operations that need to be directed to the master/slave database node.

```typescript
import { Controller, Post } from '@nestjs/common';
import { UseMasterNode } from '@hodfords/nestjs-transaction';
import { MyService } from './my.service';

@Controller('my')
export class MyController {
    constructor(private myService: MyService) {}
    
    @Post('create')
    @UseMasterNode()
    async create() {
        return this.myService.create();
    }
}
```

#### Hooks

You can use the `@RunAfterTransactionCommit` decorator to run a method after a transaction has been successfully committed. This is useful for performing actions that should only occur if the transaction was successful.

```typescript
import { Injectable } from '@nestjs/common';
import { RunAfterTransactionCommit } from '@hodfords/nestjs-transaction';
import { PostRepository } from './post.repository';

@Injectable()
export class MyService {

    constructor(private postRepo: PostRepository) {
    }

    @Transactional()
    async create() {
        // Perform some database operations
        await this.postRepo.createPost({ title: 'New Post', content: 'This is a new post.' });
        await this.emitEvent();
    }

    @RunAfterTransactionCommit()
    async emitEvent() {
        // This method will be called after the transaction is committed
        console.log('Transaction committed successfully!');
    }
}
```

You also use it with method `runAfterTransactionCommit` without the decorator:

```typescript

this.postRepo.create(...);
runAfterTransactionCommit(() => {
    // This code will run after the transaction is committed
    console.log('Transaction committed successfully!');
});
```
## License 📝

This project is licensed under the MIT License
