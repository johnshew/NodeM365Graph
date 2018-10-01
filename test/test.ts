'use strict';
import * as _debug from 'debug';
let debug = _debug('tests');
import 'mocha';
import * as chai from 'chai';
import * as restify from 'restify';
import * as uuid from 'uuid';

const expect = chai.expect;
chai.use(require('chai-http'));

describe('API endpoint /api/v1.0/reminders', function () {
  this.timeout(5000); // How long to wait for a response (ms)

  before(function () {
  });

  after(function () {
          process.exit(0);
  });


  // /api/v1.0/reminders POST 
  it('should add new reminder', () => {
/*     return chai.request(server)
      .post('/api/v1.0/reminders')
      .send({
        id: uuid.v4() as string,
        description: 'exercise',
        nextNotification: Date.parse("Aug 28, 2018 23:30:00"),
        notificationPlan: "ramped"
      })
      .then(function (res) {
        expect(res).to.have.status(201);
        expect(res).to.be.json;
        expect(res).to.have.header('location');
        expect(res.body).to.be.an('object');
        expect(res.body).to.have.property('id');
      });
 */  });



});
