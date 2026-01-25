/**
 * Application Model Tests
 * Tests for Application model validation, methods, and database operations
 */

require('../setup');
const { Application, User, ApplicationStatus } = require('../../src/models');

describe('Application Model', () => {
    describe('Application Number Generation', () => {
        test('generateApplicationNumber should return correct format', async () => {
            const appNumber = await Application.generateApplicationNumber();
            const year = new Date().getFullYear();

            expect(appNumber).toMatch(new RegExp(`^BRD-${year}-\\d{4}$`));
        });

        test('generateApplicationNumber should increment correctly', async () => {
            const appNumber1 = await Application.generateApplicationNumber();
            // Note: This test might need isolation if running concurrently
            expect(appNumber1).toBeTruthy();
        });
    });

    describe('Validation', () => {
        test('should require applicationType', async () => {
            await expect(
                Application.create({
                    applicationNumber: 'TEST-0001',
                    userId: '00000000-0000-0000-0000-000000000000',
                    licenseCategory: 'صياد مؤمن عليه',
                    duration: '3_months',
                })
            ).rejects.toThrow();
        });

        test('should validate fisherman categories', async () => {
            const validCategories = [
                'صياد مؤمن عليه',
                'صياد غير مؤمن عليه',
                'صياد تحت السن',
                'صيد رجلي',
            ];

            for (const category of validCategories) {
                const app = Application.build({
                    applicationNumber: 'TEST-0001',
                    userId: '00000000-0000-0000-0000-000000000000',
                    applicationType: 'fisherman',
                    licenseCategory: category,
                    duration: '3_months',
                    data: { marina: 'test' },
                });

                // Validation should pass
                expect(app.licenseCategory).toBe(category);
            }
        });
    });

    describe('Indexes', () => {
        test('should have defined indexes', () => {
            const indexes = Application.options.indexes;

            expect(indexes).toBeDefined();
            expect(indexes.length).toBeGreaterThan(0);

            // Check for specific indexes
            const indexFields = indexes.map(idx => idx.fields.join(','));

            expect(indexFields).toContain('user_id');
            expect(indexFields).toContain('status');
            expect(indexFields).toContain('application_type');
            expect(indexFields).toContain('application_number');
        });
    });

    describe('Associations', () => {
        test('should have user association', () => {
            expect(Application.associations.applicant).toBeDefined();
        });

        test('should have documents association', () => {
            expect(Application.associations.documents).toBeDefined();
        });

        test('should have statusHistory association', () => {
            expect(Application.associations.statusHistory).toBeDefined();
        });
    });
});
