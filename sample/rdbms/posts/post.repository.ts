import { Repository } from 'typeorm';
import { PostEntity } from './post.entity.js';
import { CustomRepository } from '@hodfords/typeorm-helper';

@CustomRepository(PostEntity)
export class PostRepository extends Repository<PostEntity> {}
