import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostModule } from './posts/post.module';
import { PostEntity } from './posts/post.entity';
import { TransactionModule } from 'lib/transaction.module';

@Module({
    imports: [
        TransactionModule.forRoot(),
        TypeOrmModule.forRoot({
            type: 'postgres',
            host: 'localhost',
            port: 5432,
            username: 'postgres',
            password: 'postgres',
            database: 'quickstart',
            entities: [PostEntity],
            synchronize: true
        }),
        PostModule
    ],
    controllers: [AppController],
    providers: [AppService]
})
export class AppModule {}
