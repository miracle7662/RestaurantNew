CREATE DEFINER=`root`@`localhost` PROCEDURE `UpdateGuestInfo`(
    IN p_checkin_id INT,
    IN p_guest_id INT,               -- 0 or NULL for new guest
    IN p_guest JSON,                 -- guest object
    IN p_documents JSON,             -- JSON array of documents
    IN p_updated_by_id INT
)
BEGIN
    -- 1. Declare variables first (no other statements before these)
    DECLARE v_new_guest_id INT;
    DECLARE v_guest_name VARCHAR(255);
    DECLARE v_mobile VARCHAR(15);
    DECLARE v_address VARCHAR(255);
    DECLARE v_email VARCHAR(100);
    DECLARE v_company_name VARCHAR(150);
    DECLARE v_company_id INT;
    DECLARE i INT DEFAULT 0;
    DECLARE doc_obj JSON;
    DECLARE doc_id INT;
    DECLARE doc_type VARCHAR(50);
    DECLARE doc_no VARCHAR(100);
    DECLARE doc_count INT DEFAULT 0;

    -- 2. Then declare handler (after all variables)
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    -- 3. Now other statements can follow
    START TRANSACTION;

    -- Extract basic fields (use IFNULL to avoid NULL issues)
    SET v_guest_name = IFNULL(JSON_UNQUOTE(JSON_EXTRACT(p_guest, '$.name')), '');
    SET v_mobile     = IFNULL(JSON_UNQUOTE(JSON_EXTRACT(p_guest, '$.mobile')), '');
    SET v_address    = IFNULL(JSON_UNQUOTE(JSON_EXTRACT(p_guest, '$.address')), '');
    SET v_email      = IFNULL(JSON_UNQUOTE(JSON_EXTRACT(p_guest, '$.email')), '');
    SET v_company_name = IFNULL(JSON_UNQUOTE(JSON_EXTRACT(p_guest, '$.organisation')), '');
    SET v_company_id = IFNULL(JSON_UNQUOTE(JSON_EXTRACT(p_guest, '$.company_id')), NULL);

    -- ------------------------------------------------------------
    -- 1. Update or Insert Guest
    -- ------------------------------------------------------------
    IF p_guest_id IS NOT NULL AND p_guest_id > 0 THEN
        UPDATE guest_master
        SET
            fragment_id      = JSON_UNQUOTE(JSON_EXTRACT(p_guest, '$.fragment_id')),
            name             = v_guest_name,
            organisation     = JSON_UNQUOTE(JSON_EXTRACT(p_guest, '$.organisation')),
            address          = v_address,
            city_id          = JSON_UNQUOTE(JSON_EXTRACT(p_guest, '$.city_id')),
            state_id         = JSON_UNQUOTE(JSON_EXTRACT(p_guest, '$.state_id')),
            country_id       = JSON_UNQUOTE(JSON_EXTRACT(p_guest, '$.country_id')),
            occupation       = JSON_UNQUOTE(JSON_EXTRACT(p_guest, '$.occupation')),
            post_held        = JSON_UNQUOTE(JSON_EXTRACT(p_guest, '$.post_held')),
            phone            = JSON_UNQUOTE(JSON_EXTRACT(p_guest, '$.phone')),
            mobile           = v_mobile,
            email            = v_email,
            website          = JSON_UNQUOTE(JSON_EXTRACT(p_guest, '$.website')),
            purpose          = JSON_UNQUOTE(JSON_EXTRACT(p_guest, '$.purpose')),
            arrived_from     = JSON_UNQUOTE(JSON_EXTRACT(p_guest, '$.arrived_from')),
            departure_to     = JSON_UNQUOTE(JSON_EXTRACT(p_guest, '$.departure_to')),
            birthday         = JSON_UNQUOTE(JSON_EXTRACT(p_guest, '$.birthday')),
            anniversary      = JSON_UNQUOTE(JSON_EXTRACT(p_guest, '$.anniversary')),
            gender           = JSON_UNQUOTE(JSON_EXTRACT(p_guest, '$.gender')),
            nationality_id   = JSON_UNQUOTE(JSON_EXTRACT(p_guest, '$.nationality_id')),
            guest_type       = JSON_UNQUOTE(JSON_EXTRACT(p_guest, '$.guest_type')),
            credit_allowed   = JSON_UNQUOTE(JSON_EXTRACT(p_guest, '$.credit_allowed')),
            company_id       = v_company_id,
            discount_percent = JSON_UNQUOTE(JSON_EXTRACT(p_guest, '$.discount_percent')),
            updated_by_id    = p_updated_by_id,
            updated_at       = NOW()
        WHERE guest_id = p_guest_id;

        SET v_new_guest_id = p_guest_id;
    ELSE
        INSERT INTO guest_master (
            fragment_id, name, organisation, address, city_id, state_id, country_id,
            occupation, post_held, phone, mobile, email, website, purpose,
            arrived_from, departure_to, birthday, anniversary, gender,
            nationality_id, guest_type, credit_allowed, company_id,
            discount_percent, created_by_id
        ) VALUES (
            JSON_UNQUOTE(JSON_EXTRACT(p_guest, '$.fragment_id')),
            v_guest_name,
            JSON_UNQUOTE(JSON_EXTRACT(p_guest, '$.organisation')),
            v_address,
            JSON_UNQUOTE(JSON_EXTRACT(p_guest, '$.city_id')),
            JSON_UNQUOTE(JSON_EXTRACT(p_guest, '$.state_id')),
            JSON_UNQUOTE(JSON_EXTRACT(p_guest, '$.country_id')),
            JSON_UNQUOTE(JSON_EXTRACT(p_guest, '$.occupation')),
            JSON_UNQUOTE(JSON_EXTRACT(p_guest, '$.post_held')),
            JSON_UNQUOTE(JSON_EXTRACT(p_guest, '$.phone')),
            v_mobile,
            v_email,
            JSON_UNQUOTE(JSON_EXTRACT(p_guest, '$.website')),
            JSON_UNQUOTE(JSON_EXTRACT(p_guest, '$.purpose')),
            JSON_UNQUOTE(JSON_EXTRACT(p_guest, '$.arrived_from')),
            JSON_UNQUOTE(JSON_EXTRACT(p_guest, '$.departure_to')),
            JSON_UNQUOTE(JSON_EXTRACT(p_guest, '$.birthday')),
            JSON_UNQUOTE(JSON_EXTRACT(p_guest, '$.anniversary')),
            JSON_UNQUOTE(JSON_EXTRACT(p_guest, '$.gender')),
            JSON_UNQUOTE(JSON_EXTRACT(p_guest, '$.nationality_id')),
            JSON_UNQUOTE(JSON_EXTRACT(p_guest, '$.guest_type')),
            JSON_UNQUOTE(JSON_EXTRACT(p_guest, '$.credit_allowed')),
            v_company_id,
            JSON_UNQUOTE(JSON_EXTRACT(p_guest, '$.discount_percent')),
            p_updated_by_id
        );
        SET v_new_guest_id = LAST_INSERT_ID();
    END IF;

    -- ------------------------------------------------------------
    -- 2. Update checkin_master (only guest_id)
    -- ------------------------------------------------------------
    UPDATE checkin_master
    SET
        guest_id      = v_new_guest_id,
        updated_by_id = p_updated_by_id,
        updated_date  = NOW()
    WHERE checkin_id = p_checkin_id;

    -- ------------------------------------------------------------
    -- 3. Update all checkin_detail_master rows for this checkin
    -- ------------------------------------------------------------
    UPDATE checkin_detail_master
    SET
        guest_id      = v_new_guest_id,
        guest_name    = v_guest_name,
        address       = v_address,
        mobile        = v_mobile,
        company_name  = v_company_name,
        emailed       = v_email,
        updated_date  = NOW(),
        updated_by_id = p_updated_by_id
    WHERE checkin_id = p_checkin_id;

    -- ------------------------------------------------------------
    -- 4. Handle Documents (JSON array)
    -- ------------------------------------------------------------
    IF p_documents IS NOT NULL AND JSON_LENGTH(p_documents) > 0 THEN
        SET doc_count = JSON_LENGTH(p_documents);
        SET i = 0;
        WHILE i < doc_count DO
            SET doc_obj = JSON_EXTRACT(p_documents, CONCAT('$[', i, ']'));
            SET doc_id = IFNULL(JSON_UNQUOTE(JSON_EXTRACT(doc_obj, '$.document_id')), 0);
            SET doc_type = IFNULL(JSON_UNQUOTE(JSON_EXTRACT(doc_obj, '$.document_type')), '');
            SET doc_no = IFNULL(JSON_UNQUOTE(JSON_EXTRACT(doc_obj, '$.document_number')), '');

            IF doc_id > 0 THEN
                UPDATE guest_document
                SET document_type = doc_type,
                    document_no   = doc_no
                WHERE document_id = doc_id;
            ELSE
                INSERT INTO guest_document (guest_id, document_type, document_no)
                VALUES (v_new_guest_id, doc_type, doc_no);
            END IF;

            SET i = i + 1;
        END WHILE;
    END IF;

    COMMIT;
END