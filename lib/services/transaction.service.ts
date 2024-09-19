import { Injectable } from '@nestjs/common';
import { PARAMTYPES_METADATA, SELF_DECLARED_DEPS_METADATA } from '@nestjs/common/constants';
import { ModuleRef } from '@nestjs/core';
import { isFunction, isString } from 'lodash';
import { EntityManager, Repository } from 'typeorm';
import { ClassType } from '../types/class.type';
import { ForwardRef } from '../types/forward-ref.type';
import { TransactionOption } from '../interfaces/transaction-option.interface';
import { ProviderParam } from '../types/provider-param.type';
import { EXCLUDED_OPTIONS } from '../constants/excluded.constant';
import { ExcludeType } from '../types/exclude.type';

@Injectable()
export class TransactionService {
    public static moduleRef: ModuleRef = null;
    protected excluded: ExcludeType[] = [];

    public withTransaction(manager: EntityManager, transactionOptions: TransactionOption = {}): this {
        const cache: Map<string, any> = new Map();
        return this.findArgumentsForProvider(
            this.constructor as ClassType<this>,
            manager,
            [
                ...TransactionService.moduleRef.get(EXCLUDED_OPTIONS, { strict: false }),
                ...this.excluded,
                transactionOptions.excluded ?? []
            ],
            cache
        );
    }

    private refId(param: ProviderParam): string {
        return `${(param as ClassType).name}-ref`;
    }

    private resolveForwardRefArgument(
        param: ProviderParam,
        instanceHost: ProviderParam,
        manager: EntityManager,
        excluded: ExcludeType[],
        cache: Map<string, any>
    ): any {
        const tmpParam: ClassType = this.getOverrideProvider((param as ForwardRef).forwardRef());
        const id = this.refId(instanceHost);

        if (cache.has(this.refId(tmpParam))) {
            return cache.get(this.refId(tmpParam));
        }
        if (!cache.has(id)) {
            cache.set(id, new (instanceHost as ClassType)());
        }

        return this.findArgumentsForProvider(tmpParam, manager, excluded, cache);
    }

    private getArgument(
        param: ProviderParam,
        manager: EntityManager,
        excluded: ExcludeType[],
        instanceHost: ProviderParam,
        cache: Map<string, any>
    ): any {
        let id: string;
        let tmpParam: string | ClassType;

        if (isString(param)) {
            id = param as string;
            tmpParam = param as string;
        } else if ((param as ClassType).name) {
            id = (param as ClassType).name;
            tmpParam = param as ClassType;
        } else if ((param as ForwardRef).forwardRef) {
            return this.resolveForwardRefArgument(param, instanceHost, manager, excluded, cache);
        }
        const isExcluded = excluded.some((item) => {
            const excludedId = isString(item) ? item : (item as ClassType).name;
            return excludedId === id;
        });

        if (id === ModuleRef.name) {
            return TransactionService.moduleRef;
        }
        if (isExcluded) {
            /// Returns current instance of service, if it is excluded
            return TransactionService.moduleRef.get(tmpParam, { strict: false });
        }
        if (cache.has(id)) {
            return cache.get(id);
        }

        let argument: Repository<any>;
        const canBeRepository = id.includes('Repository') || this.hasRepositoryProperties(param);
        if (isString(tmpParam) || canBeRepository) {
            argument = this.getRepositoryArgument(canBeRepository, tmpParam, manager);
        } else {
            tmpParam = this.getOverrideProvider(tmpParam);
            argument = this.findArgumentsForProvider(tmpParam as ClassType, manager, excluded, cache);
        }

        cache.set(id, argument);
        return argument;
    }

    private hasRepositoryProperties(param: ProviderParam): boolean {
        return (
            typeof param === 'function' &&
            Object.keys(new param()).includes('target') &&
            Object.keys(new param()).includes('manager')
        );
    }

    private getOverrideProvider(param: string | ClassType): any {
        return TransactionService.moduleRef.get(param, { strict: false }).constructor;
    }

    private getRepositoryArgument(
        canBeRepository: boolean,
        tmpParam: string | ClassType,
        manager: EntityManager
    ): Repository<any> {
        let dependency: Repository<any>;
        let isCustomRepository = false;

        try {
            if (canBeRepository) {
                tmpParam =
                    isString(tmpParam) || isFunction(tmpParam)
                        ? TransactionService.moduleRef.get(tmpParam, { strict: false })
                        : tmpParam;
                dependency = manager.withRepository(tmpParam as any);
                isCustomRepository = true;
            }
        } catch {
            dependency = TransactionService.moduleRef.get(tmpParam, { strict: false });
        }

        const isRepository = (dependency instanceof Repository || canBeRepository) && !isCustomRepository;
        if (isRepository) {
            // If the dependency is a repository, make a new repository with the desired transaction manager.
            const entity: any = dependency.metadata.target;
            return manager.getRepository(entity);
        }

        return dependency;
    }

    private findArgumentsForProvider(
        constructor: ClassType,
        manager: EntityManager,
        excluded: ExcludeType[],
        cache: Map<string, any>
    ): any {
        const args: any[] = [];
        const keys = Reflect.getMetadataKeys(constructor);

        if (keys.includes(PARAMTYPES_METADATA)) {
            const paramTypes: Array<string | ClassType> = Reflect.getMetadata(PARAMTYPES_METADATA, constructor);

            // In case using decorator @Inject, PARAMTYPES_METADATA return undefined metadata
            // We have to use SELF_DECLARED_DEPS_METADATA instead
            const selfParams = Reflect.getMetadata(SELF_DECLARED_DEPS_METADATA, constructor) || [];
            for (const { index, param } of selfParams) {
                paramTypes[index] = param;
            }

            for (const param of paramTypes) {
                const argument = this.getArgument(param, manager, excluded, constructor, cache);
                args.push(argument);
            }
        }

        const cachedInstance = cache.get(this.refId(constructor));
        const resolvedInstance = new constructor(...args);
        if (cachedInstance) {
            Object.assign(cachedInstance, resolvedInstance);
            return cachedInstance;
        }

        return resolvedInstance;
    }
}
