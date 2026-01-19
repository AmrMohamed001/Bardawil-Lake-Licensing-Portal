-- SQL Script to add new enum values for Paymob integration
-- Run this script in your PostgreSQL database

-- Add new status value for applications
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'approved_payment_pending' 
                   AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'enum_applications_status')) THEN
        ALTER TYPE "enum_applications_status" ADD VALUE 'approved_payment_pending';
    END IF;
END
$$;

-- Add new notification types
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'payment_success' 
                   AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'enum_notifications_type')) THEN
        ALTER TYPE "enum_notifications_type" ADD VALUE 'payment_success';
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'payment_failed' 
                   AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'enum_notifications_type')) THEN
        ALTER TYPE "enum_notifications_type" ADD VALUE 'payment_failed';
    END IF;
END
$$;

-- Success message
SELECT 'Enum values added successfully!' as message;
