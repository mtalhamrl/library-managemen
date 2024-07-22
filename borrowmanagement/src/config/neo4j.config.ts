import { ConfigModule, ConfigService } from '@nestjs/config';
import { Neo4jConnection } from 'nest-neo4j';

export const neo4jConfig = {
  imports: [ConfigModule],
  useFactory: async (
    configService: ConfigService,
  ): Promise<Neo4jConnection> => {
    console.log('NEO4J_HOST', configService.get<string>('NEO4J_HOST'));
    return {
      scheme: 'neo4j',
      host: configService.get<string>('NEO4J_HOST'),
      port: configService.get<number>('NEO4J_PORT'),
      username: configService.get<string>('NEO4J_USERNAME'),
      password: configService.get<string>('NEO4J_PASSWORD'),
      database: 'borrowmanagement',
    };
  },
  inject: [ConfigService],
};
