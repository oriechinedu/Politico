import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import pool from '../config/connection';

dotenv.config();
/**
 * Defines Admin actions
 *
 * @class AdminController
 */
class AdminController {
  /**
   *
   * Registers the aspirant for a political office
   * @static
   * @param {object} req - request
   * @param {object} res - response
   * @param {object} next - callback
   * @returns
   * @memberof AdminController
   */
  static async registerCandidate(req, res) {
    const client = await pool.connect();
    let aspirant;
    try {
      const { office, userId, party } = req.body;
      const sqlQuery = `INSERT INTO candidates(office, candidate, party)
                    VALUES($1,$2, $3) RETURNING *`;
      const values = [office, userId, party];
      aspirant = await client.query({ text: sqlQuery, values });
      if (aspirant.rows && aspirant.rowCount) {
        return res.status(201).json({
          status: 201,
          data: { office: aspirant.rows[0].office, user: aspirant.rows[0].candidate },
          message: 'candidate successfully registered',
        });
      }
      return res.status(500).json({ status: 500, error: 'Internal server error' });
    } catch (err) {
      const { constraint } = err;
      if (constraint === 'candidates_party_fkey') {
        return res.status(409).json({ status: 400, message: 'The party does not exist' });
      }
      return res.status(500).json({ status: 500, error: 'Internal server errorr' });
    } finally {
      await client.release();
    }
  }

  /**
 *
 * Stores the user's vote to the database
 * @static
 * @param {object} req - request
 * @param {object} res - response
 * @returns
 * @memberof AdminController
 */
  static async vote(req, res) {
    const client = await pool.connect();
    let vote;
    try {
      const { office, candidate, voter, party } = req.body;
      const sqlQuery = `INSERT INTO votes(office, candidate, voter, party)
                    VALUES($1, $2, $3, $4) RETURNING *`;
      const values = [office, candidate, voter, party];
      vote = await client.query({ text: sqlQuery, values });
      if (vote.rows && vote.rowCount) {
        vote = vote.rows[0];
        return res.status(201).json({
          status: 201,
          data: {
            office: vote.office,
            candidate: vote.candidate,
            voter: vote.voter,
            message: 'congratulations!!!, you have successfully voted' },
        });
      }
      return res.status(500).json({ status: 500, error: 'Internal server error' });
    } catch (err) {
      return res.status(500).json({ status: 500, error: 'Internal server errorr' });
    } finally {
      await client.release();
    }
  }

  /**
 *
 * @description Retrieves the result of a given political office
 * @static
 * @param {object} req - request
 * @param {object} res - response
 * @returns
 * @memberof AdminController
 */
  static async getElectionResult(req, res) {
    const { office } = req.body;
    const client = await pool.connect();
    try {
      const sqlQuery = `SELECT office, candidate, users.firstname, users.lastname,
      parties.name as partyname, parties.logourl as partylogo, COUNT(candidate) AS result
      FROM votes
      INNER JOIN users
      ON users.id = votes.candidate
      INNER JOIN parties
      ON parties.id = votes.party
      WHERE office = $1
      GROUP BY candidate, office, users.firstname,
      users.lastname, parties.name, parties.logourl`;
      const values = [office];
      const result = await client.query({ text: sqlQuery, values });
      if (result.rowCount) {
        return res.status(200).json({
          status: 200,
          data: result.rows,
        });
      }
      return res.status(404).json({ status: 404, error: 'No result Found for this office' });
    } catch (err) {
      return;
    } finally { await client.release(); }
  }

  static async getAllCandidates(req, res) {
    const sqlQuery = `SELECT candidates.id, users.firstname, 
    users.lastname, offices.name, offices.type FROM candidates 
    JOIN users ON candidates.candidate = users.id
    JOIN offices ON candidates.office = offices.id
    `;
    const client = await pool.connect();
    try {
      const candidates = await client.query(sqlQuery);
      if (candidates.rowCount) {
        return res.status(200).json({
          status: 200,
          data: candidates.rows,
        });
      }
      return res.status(200).json({ status: 200, data: [] });
    } catch (err) {
      return res.status(500).json({ status: 500, error: 'Internal Server error' });
    } finally {
      await client.release();
    }
  }

  static async getAllOfficeCandidates(req, res) {
    const { officeId } = req.params;
    const sqlQuery = `SELECT candidates.id, candidates.candidate,
    candidates.party, candidates.office, users.firstname, 
    users.lastname, offices.name AS officename, offices.type AS officetype, parties.name AS partyname,
    parties.logourl AS partylogo FROM candidates 
    JOIN users ON candidates.candidate = users.id
    JOIN offices ON candidates.office = offices.id
    JOIN parties ON candidates.party = parties.id
    WHERE office = $1`;
    const values = [officeId];
    const client = await pool.connect();
    try {
      const candidates = await client.query({ text: sqlQuery, values });
      if (candidates.rowCount) {
        return res.status(200).json({
          status: 200,
          data: candidates.rows,
        });
      }
      return res.status(200).json({ status: 200, data: [] });
    } catch (err) {
      return res.status(500).json({ status: 500, error: 'Internal Server error' });
    } finally {
      await client.release();
    }
  }

  static async getUserVoteHistories(req, res) {
    const { token } = req.body;
    const voter = token.id;
    const sqlQuery = `SELECT votes.id, votes.createdon, offices.name as officename, offices.type AS officetype,
      parties.name AS partyname, parties.logourl AS partylogo, users.firstname, users.lastname FROM votes
      JOIN offices ON offices.id = votes.office
      JOIN parties ON parties.id = votes.party
      JOIN users ON users.id = votes.candidate
      WHERE voter = $1`;
    const values = [voter];
    const client = await pool.connect();
    try {
      const votes = await client.query({ text: sqlQuery, values });
      if (votes.rowCount) {
        return res.status(200).json({
          status: 200,
          data: votes.rows,
        });
      }
      return res.status(200).json({ status: 200, data: [] });
    } catch (err) {
      return res.status(500).json({ status: 500, error: 'Internal Server error' });
    } finally {
      await client.release();
    }
  }

  static validateToken(req, res) {
    const { token } = req.body;
    jwt.verify(token, process.env.SECRET, (err, decoded) => {
      if (err) return res.status(401).json({ status: 401, error: 'Invalid' });
      return res.status(200).json({ status: 200, data: decoded });
    });
  }
}
export default AdminController;
