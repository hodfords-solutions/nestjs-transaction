import { Module } from '@nestjs/common';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { PostEntity } from './post.entity';
import { TypeOrmHelperModule } from '@hodfords/typeorm-helper';
import { PostRepository } from './post.repository';

@Module({
    imports: [TypeOrmHelperModule.forCustomRepository([PostEntity, PostRepository])],
    controllers: [PostController],
    providers: [PostService]
})
export class PostModule {}
