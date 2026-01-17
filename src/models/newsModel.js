const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

/**
 * News Model - Based on SRS Section 5.2.8
 * Stores news and announcements for the public portal
 */
const News = sequelize.define(
  'News',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    titleAr: {
      type: DataTypes.STRING(200),
      allowNull: false,
      field: 'title_ar',
    },
    titleEn: {
      type: DataTypes.STRING(200),
      allowNull: true,
      field: 'title_en',
    },
    contentAr: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'content_ar',
    },
    contentEn: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'content_en',
    },
    category: {
      type: DataTypes.ENUM('announcement', 'news', 'update', 'alert'),
      defaultValue: 'news',
    },
    imagePath: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'image_path',
    },
    isPublished: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_published',
    },
    publishedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'published_at',
    },
    isPinned: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_pinned',
    },
    viewCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'view_count',
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      field: 'created_by',
    },
  },
  {
    tableName: 'news',
    timestamps: true,
    underscored: true,
  }
);

module.exports = News;
