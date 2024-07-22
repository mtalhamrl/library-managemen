import { Injectable } from '@nestjs/common';
import { Neo4jService } from 'nest-neo4j';
import { CreateFloorDto } from './dto/create-floor.dto';
import { DeleteFloorDto } from './dto/delete-floor.dto';

@Injectable()
export class FloorService {
  constructor(private readonly neo4jService: Neo4jService) {}

  async create(createFloorDto: CreateFloorDto) {
    const { floorNumber, blockCode } = createFloorDto;
    const session = this.neo4jService.getWriteSession();
    const transaction = session.beginTransaction();

    try {
      // Blok varlığını kontrol et
      const checkBlockQuery = `
        MATCH (block:Block {blockCode: $blockCode})
        RETURN block
      `;
      const checkParams = { blockCode };
      const checkResult = await transaction.run(checkBlockQuery, checkParams);

      if (checkResult.records.length === 0) {
        throw new Error('Block not found');
      }

      // Kat oluşturma
      const floorQuery = `
        CREATE (floor:Floor {floorNumber: $floorNumber})
        RETURN floor
      `;
      const floorParams = { floorNumber };
      const floorResult = await transaction.run(floorQuery, floorParams);
      const floorNode = floorResult.records[0].get('floor');
      const floorId = floorNode.identity.toNumber();

      // Blok ile Kat arasında ilişki oluşturma
      const blockFloorLinkQuery = `
        MATCH (block:Block {blockCode: $blockCode})
        MATCH (floor:Floor) WHERE id(floor) = $floorId
        CREATE (block)-[:HAS_FLOOR]->(floor)
        RETURN block, floor
      `;
      const blockFloorLinkParams = { blockCode, floorId };
      await transaction.run(blockFloorLinkQuery, blockFloorLinkParams);

      await transaction.commit();
      return floorNode.properties;
    } catch (error) {
      await transaction.rollback();
      throw error;
    } finally {
      await session.close();
    }
  }

  async findAll() {
    const query = `
      MATCH (floor:Floor)
      RETURN floor
    `;
    const result = await this.neo4jService.read(query);
    return result.records.map((record) => record.get('floor').properties);
  }

  async delete(deleteFloorDto: DeleteFloorDto) {
    const { floorNumber } = deleteFloorDto;
    const session = this.neo4jService.getWriteSession();
    const transaction = session.beginTransaction();

    try {
      // Kat node'unun varlığını kontrol et
      const checkFloorQuery = `
        MATCH (floor:Floor {floorNumber: $floorNumber})
        RETURN floor
      `;
      const checkParams = { floorNumber };
      const checkResult = await transaction.run(checkFloorQuery, checkParams);

      if (checkResult.records.length === 0) {
        throw new Error('Floor not found');
      }

      // Kat node'una ait tüm ilişkileri sil
      const deleteRelationshipsQuery = `
        MATCH (floor:Floor {floorNumber: $floorNumber})-[r]-()
        DELETE r
      `;
      await transaction.run(deleteRelationshipsQuery, checkParams);

      // Kat node'unu sil
      const deleteFloorQuery = `
        MATCH (floor:Floor {floorNumber: $floorNumber})
        DELETE floor
      `;
      await transaction.run(deleteFloorQuery, checkParams);

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    } finally {
      await session.close();
    }
  }

  async findBookshelvesInFloor(floorNumber: number) {
    const query = `
      MATCH (floor:Floor {floorNumber: $floorNumber})-[:HAS_BOOKSHELF]->(bookshelf:Bookshelf)
      RETURN bookshelf
    `;
    const params = { floorNumber };
    const result = await this.neo4jService.read(query, params);
    return result.records.map((record) => record.get('bookshelf').properties);
  }
}
