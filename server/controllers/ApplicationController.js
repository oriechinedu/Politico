import pool from '../config/connection';

class ApplicationController {
  static async createApplication(req, res) {
    const { office, party, applicant } = req.body;
    const client = await pool.connect();
    const sqlQuery = {
      text: 'INSERT INTO applications(party, office, applicant) VALUES($1, $2, $3) RETURNING *',
      values: [party, office, applicant],
    };
    try {
      const application = await client.query(sqlQuery);
      if (application.rowCount) {
        return res.status(201).json({ status: 201, data: application.rows[0], message: 'Application submitted' });
      }
      return res.status(500).json({ status: 500, error: 'Internal server error' });
    } catch (err) { return res.status(500).json({ status: 500, error: 'Internal server error' }); } finally { await client.release(); }
  }

  /**
   *Retrieves all applications record
   * @static
   * @param {object} req - request
   * @param {object} res - response
   */
  static async getAllApplications(req, res) {
    const sqlQuery = `SELECT applications.id, applications.status, users.firstname as firstname,
    users.lastname as lastname,parties.name as partyname, offices.name as officename,
    offices.type as officetype, applications.createdon FROM applications
    JOIN users ON users.id = applications.applicant
    JOIN parties ON parties.id = applications.party
    JOIN offices ON offices.id = applications.office
    ORDER BY applications.createdon DESC`;
    const client = await pool.connect();
    try {
      const applications = await client.query(sqlQuery);
      if (applications.rowCount) {
        return res.status(200).json({
          status: 200,
          data: applications.rows,
          message: 'OK',
        });
      }
      return res.status(200).json({ status: 200, data: [], message: 'No applications Found' });
    } catch (err) {
      return res.status(500).json({ status: 500, error: 'Internal Server error' });
    } finally {
      await client.release();
    }
  }

  static async editApplication(req, res) {
    const { applicationId } = req.params;
    const { status } = req.body;
    const sqlQuery = { text: 'UPDATE applications SET status = $1 WHERE id = $2 RETURNING id, status',
      values: [status, applicationId] };
    const client = await pool.connect();
    try {
      const application = await client.query(sqlQuery);
      if (application.rowCount) {
        return res.status(200).json({
          status: 200,
          data: application.rows[0],
          message: `Application ${status} successfully`,
        });
      }
      return res.status(500).json({ status: 500, message: 'Unable to update the application' });
    } catch (err) {
      return res.status(500).json({ status: 500, error: 'Internal Server error' });
    } finally {
      await client.release();
    }
  }

  /**
 *@description Deletes an application record
 * @param {object} req - request
 * @param {object} res - response
 */
  static async deleteApplication(req, res) {
    const { applicationId } = req.params;
    const sqlQuery = { text: 'DELETE FROM applications WHERE id = $1 RETURNING id', values: [applicationId] };
    const client = await pool.connect();
    try {
      const party = await client.query(sqlQuery);
      if (party.rowCount) {
        return res.status(200).json({
          status: 200,
          data: { message: 'Application deleted successfully' },
        });
      }
      return res.status(500).json({ status: 500, message: 'Unable to delete the application' });
    } catch (err) {
      return res.status(500).json({ status: 500, error: 'Internal Server error' });
    } finally {
      await client.release();
    }
  }
}
export default ApplicationController;