<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo_text.svg" width="320" alt="Nest Logo" /></a>
</p>

# nestjs-transaction

## Description
Nest transaction help you easily work with `transaction` more than ever!

## Installation 🤖
```ts
npm install @hodfods/nestjs-transaction --save-dev
```

## Usage ⚡
You need to extend the `TransactionService` imported from library in your `Service` first
and then call your service with this `withTransaction` method in the callback of transaction you are using.

Code demo:
```typescript
// your-service.service.ts
@Injectable()
export class YourService extends TransactionService {
    public constructor(
        @InjectRepository(YourRepository) private reposotiry: Repository<Entity>,
        private yourCustomRepository: CustomRepository,
        private yourService: Service,
        // Let's say you dont want to rebuild this service in the transaction
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

```typescript
// your-controller.controller.ts
@Controller()
export class SomeController {
  constructor(
    private readonly yourService: YourService,
    private connection: Connection,
  ) {}
  
  async method(payload: SomePayload): Promise<SomeResponse> {
    return this.connection.transaction(async entityManager => {
      return await this.yourService.withTransaction(
          entityManager,
          { excluded: [CacheService] }
      ).theMethodWillUseTransaction(payload);
    });
  }
}
```
