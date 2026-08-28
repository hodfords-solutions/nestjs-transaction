import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PostModule } from './posts/post.module.js';
import { PostEntity } from './posts/post.entity.js';
import { TransactionModule } from '../../lib/transaction.module.js';
import { TypeOrmHelperModule } from '@hodfords/typeorm-helper';

@Module({
    imports: [
        TransactionModule.forRoot({
            autoUseMasterNodeForChangeRequest: true
        }),
        TypeOrmHelperModule.forRoot({
            type: 'postgres',
            entities: [PostEntity],
            synchronize: true,
            replication: {
                master: {
                    host: 'localhost',
                    port: 15432,
                    database: 'my_database',
                    username: 'postgres',
                    password: 'my_password'
                },
                slaves: [
                    {
                        host: 'localhost',
                        port: 25432,
                        database: 'my_database',
                        username: 'postgres',
                        password: 'my_password'
                    }
                ]
            }
        }),
        PostModule
    ],
    controllers: [AppController],
    providers: [AppService]
})
export class AppModule {}
