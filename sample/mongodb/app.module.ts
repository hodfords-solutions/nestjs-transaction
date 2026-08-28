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
            type: 'mongodb',
            entities: [PostEntity],
            synchronize: true,
            // useUnifiedTopology: true,
            url: 'mongodb://mongo1:27017,mongo2:27018,mongo3:27019/mydb?replicaSet=rs0'
        }),
        PostModule
    ],
    controllers: [AppController],
    providers: [AppService]
})
export class AppModule {}
