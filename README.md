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

First, extend the `TransactionService` imported from the library in your service, and then use the `withTransaction`
method within the transaction callback to call your service.

### How to use

##### your-service.service.ts

```typescript
@Injectable()
export class YourService extends TransactionService {
    public constructor(
        @InjectRepository(YourRepository) private repository: Repository<Entity>,
        private yourCustomRepository: CustomRepository,
        private yourService: Service,
        // Let's say you don't want to rebuild this service in the transaction
        private yourCacheService: CacheService,
        @Inject(forwardRef(() => ForwardService)) private yourForwardService: ForwardService
    ) {
        super();
    }

    async theMethodWillUseTransaction(payload: SomePayload) {
        // logic code here
    }
}
```

##### your-controller.controller.ts

```typescript
@Controller()
export class SomeController {
    constructor(
        private readonly yourService: YourService,
        private connection: Connection
    ) {}

    async method(payload: SomePayload): Promise<SomeResponse> {
        return this.connection.transaction(async (entityManager) => {
            return await this.yourService
                .withTransaction(entityManager, { excluded: [CacheService] })
                .theMethodWillUseTransaction(payload);
        });
    }
}
```

### Exclude services from transaction

You can configure services to be excluded from transactions by specifying them in `transactionConfig` and importing it
into `AppModule`

```typescript
export const transactionConfig = TransactionModule.forRoot([MailService, I18nService, StorageService, DataSource]);
```

## License 📝

This project is licensed under the MIT License
