import { BadRequestException, Injectable } from '@nestjs/common';
import { CreatePostDto } from './post.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { PostEntity } from './post.entity';
import { Repository } from 'typeorm';
import { TransactionService } from 'lib';

@Injectable()
export class PostService extends TransactionService {
    constructor(@InjectRepository(PostEntity) private postRepo: Repository<PostEntity>) {
        super();
    }

    async createPost(dto: CreatePostDto): Promise<void> {
        await this.postRepo.insert(dto);

        // Random throw error to make sure the transaction works properly
        if (Math.random() > 0.5) {
            throw new BadRequestException('Random error occurred');
        }
    }
}
