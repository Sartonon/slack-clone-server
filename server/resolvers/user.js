import formatErrors from '../formatErrors';
import requiresAuth from '../permissions';

import { tryLogin } from '../auth';

export default {
  User: {
    teams: (parent, args, { models, user }) => {
      return models.sequelize.query(
        'SELECT * FROM teams AS team JOIN members AS member ON team.id = member.team_id WHERE member.user_id = ?',
        { replacements: [user.id], model: models.Team, raw: true },
      );
    },
  },
  Query: {
    allUsers: (parent, args, { models }) => models.User.findAll(),
    me: requiresAuth.createResolver((parent, args, { models, user }) =>
      models.User.findOne({ where: { id: user.id } }),
    ),
    // inviteTeams: requiresAuth.createResolver(
    //   async (parent, args, { models, user }) => {
    //     return models.Team.findAll(
    //       {
    //         include: [
    //           {
    //             model: models.User,
    //             where: { id: user.id },
    //           },
    //         ],
    //       },
    //       { raw: true },
    //     );
    //   },
    // ),
  },
  Mutation: {
    login: (parent, { email, password }, { models, SECRET, SECRET2 }) =>
      tryLogin(email, password, models, SECRET, SECRET2),
    register: async (parent, args, { models }) => {
      try {
        const user = await models.User.create(args);
        return {
          ok: true,
          user,
        };
      } catch (err) {
        return {
          ok: false,
          errors: formatErrors(err, models),
        };
      }
    },
  },
};
