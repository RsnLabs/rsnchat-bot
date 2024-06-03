const { SlashCommandBuilder, AttachmentBuilder } = require("discord.js");
const axios = require('axios');
const log = require('../utils/logger');
const { RsnChat } = require('rsnchat');
const dotenv = require("dotenv")
dotenv.config();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("dalle")
    .setDescription("Generate dalle Image.")
    .addStringOption((option) => option
        .setName("prompt")
        .setDescription("Provide your prompt")
        .setRequired(true)
    )
    .addIntegerOption((option) => option
      .setName("amount")
      .setDescription("The amount of images to generate.")
      .setRequired(false)
      .addChoices(
        { name: "1", value: 1 },
        { name: "2", value: 2 },
        { name: "3", value: 3 },
        { name: "4", value: 4 }
      )
    ),

  async execute(interaction) {
    
    await interaction.reply("Generating Image...")
    
    const prompt = interaction.options.getString("prompt");
    const amount = interaction.options.getInteger("amount") || 1;

    try {
      const rsnchat = new RsnChat(`${process.env.API_KEY}`);

      const attachments = [];

      for (let i = 0; i < amount; i++) {
        const response = await rsnchat.dalle(prompt);
        const image = response.image.base64;
        const imageBuffer = Buffer.from(image, 'base64');
        const attachment = new AttachmentBuilder(imageBuffer, { name: `image_${i + 1}.png` });
        attachments.push(attachment);
      }

      await interaction.editReply({ content: 'Generated Images:', files: attachments });
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        await interaction.editReply({ content:'Please try again later.' });
        return;
      }
      
      if (error.response && error.response.status === 503) {
        
        await interaction.editReply({ content:'API is unavailable.' });
        return;
      }
      
      log.error(`Error importing or using Dalle: ${error}`);
      await interaction.followUp("An error occurred while using Dalle.");
    }
  },
};
