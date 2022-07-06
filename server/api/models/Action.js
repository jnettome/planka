/**
 * Action.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

const Types = {
  CREATE_CARD: 'createCard',
  MOVE_CARD: 'moveCard',
  COMMENT_CARD: 'commentCard',
};

module.exports = {
  Types,

  attributes: {
    //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
    //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
    //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝

    type: {
      type: 'string',
      isIn: Object.values(Types),
      required: true,
    },
    data: {
      type: 'json',
      required: true,
    },

    //  ╔═╗╔╦╗╔╗ ╔═╗╔╦╗╔═╗
    //  ║╣ ║║║╠╩╗║╣  ║║╚═╗
    //  ╚═╝╩ ╩╚═╝╚═╝═╩╝╚═╝

    //  ╔═╗╔═╗╔═╗╔═╗╔═╗╦╔═╗╔╦╗╦╔═╗╔╗╔╔═╗
    //  ╠═╣╚═╗╚═╗║ ║║  ║╠═╣ ║ ║║ ║║║║╚═╗
    //  ╩ ╩╚═╝╚═╝╚═╝╚═╝╩╩ ╩ ╩ ╩╚═╝╝╚╝╚═╝

    cardId: {
      model: 'Card',
      required: true,
      columnName: 'card_id',
    },
    userId: {
      model: 'User',
      required: true,
      columnName: 'user_id',
    },
  },

  async afterCreate(valuesToSet, proceed) {
    let pretext;
    let description;

    proceed();

    const card = await Card.findOne(valuesToSet.cardId);
    const user = await User.findOne(valuesToSet.userId);

    const board = await Board.findOne(card.boardId);
    const project = await Project.findOne(board.projectId);
    const list = await List.findOne(card.listId);

    switch (valuesToSet.type) {
      case Types.COMMENT_CARD:
        pretext = 'new comment on';
        description = valuesToSet.data.text;
        break;

      case Types.MOVE_CARD:
        pretext = 'card moved';
        if (['in review', 'done'].includes(list.name.toString().toLowerCase())) {
          pretext = 'card done';
        }
        description = card.description;
        break;

      default:
        pretext = 'new card';
        description = card.description;
        break;
    }

    const obj = {
      title: `${pretext}: ${card.name}`,
      description,
      url: `${process.env.BASE_URL}/cards/${valuesToSet.cardId}`, // TODO url do frontend, nao do back
      projectName: project.name || card.boardId,
      listName: list.name || card.listId,
      userName: user.username || '',
      key: valuesToSet.type,
    };

    await sails.helpers.utils.discordWebhookSender(obj);
  },
};
