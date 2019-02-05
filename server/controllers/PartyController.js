
import pool from '../config/connection';


/**
 *Defines the actions for Party Endpoints
 *@class PartyController
 */
class PartyController {
  /**
   *
   * @param {object} req - request
   * @param {object} res - response
   */
  static async createParty(req, res) {
    const client = await pool.connect();
    let party;
    try {
      const { name, hqAddress, logoUrl } = req.body;
      const text = `INSERT INTO parties(name, hqAddress, logoUrl)
                      VALUES($1,$2,$3) RETURNING id, name`;
      const values = [name, hqAddress, logoUrl];
      party = await client.query({ text, values });
      if (party.rows && party.rowCount) {
        party = party.rows[0];
        return res.status(201).json({
          status: 201, data: party,
        });
      }
    } catch (err) {
      console.log(err);
      return res.status(500).json({ error: true, message: 'Internal server error' });
    } finally {
      await client.release();
    }
  }

  /**
   * Get a single party record
   * @static
   * @param {object} req - request
   * @param {object} res - response
   */
  static async getAParty(req, res) {
    const { partyId } = req.params;
    const client = await pool.connect();
    let party;
    try {
      const sqlQuery = 'SELECT * FROM parties WHERE id = $1 LIMIT 1';
      const values = [partyId];
      party = await client.query({ text: sqlQuery, values });
      if (party.rowCount) {
        res.status(200).json({
          status: 200,
          data: party.rows[0],
        });
      } else {
        return res.status(404).json({
          status: 404,
          error: `Party with ID: ${partyId} Not Found`,
        });
      }
    } catch (err) {
      return res.status(500).json({ status: 500, errror: 'Internal server error' });
    } finally {
      client.release();
    }
  }

  /**
   *Retrieves all parties record
   * @static
   * @param {object} req - request
   * @param {object} res - response
   */
  static async allParties(req, res) {
    const queryText = 'SELECT * FROM parties';
    const client = await pool.connect();
    try {
      const parties = await client.query(queryText);
      if (parties.rowCount) {
        return res.status(200).json({
          status: 200,
          data: [parties.rows],
        });
      }
      return res.status(200).json({ status: 200, data: [] });
    } catch (err) {
      return res.status(500).json({ status: 500, error: 'Internal Server error' });
    } finally {
      client.release();
    }
  }
}

export default PartyController;
