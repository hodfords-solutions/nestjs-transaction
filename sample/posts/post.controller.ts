import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './post.dto';
import { DataSource } from 'typeorm';

@Controller('posts')
export class PostController {
    constructor(
        private dateSource: DataSource,
        private postService: PostService
    ) {}

    @Post()
    @HttpCode(HttpStatus.NO_CONTENT)
    createPost(@Body() dto: CreatePostDto): Promise<void> {
        return this.dateSource.transaction((manager) => {
            return this.postService.withTransaction(manager).createPost(dto);
        });
    }
}
