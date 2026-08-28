import { Module } from '@nestjs/common';
import { PostController } from './post.controller.js';
import { PostService } from './post.service.js';
import { PostEntity } from './post.entity.js';
import { TypeOrmHelperModule } from '@hodfords/typeorm-helper';
import { PostRepository } from './post.repository.js';

@Module({
    imports: [TypeOrmHelperModule.forCustomRepository([PostEntity, PostRepository])],
    controllers: [PostController],
    providers: [PostService]
})
export class PostModule {}
