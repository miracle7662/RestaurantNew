const db = require('../config/db');



exports.getCustomer = (req, res) => {
    const customers = db.prepare(`
        SELECT 
            C.customerid, 
            C.name, 
            C.countryCode, 
            C.mobile, 
            C.mail, 
            M.cityid,
            M.city_name,
            C.address1, 
            C.address2, 
            S.stateid,
            S.state_name,
            C.pincode, 
            C.gstNo, 
            C.fssai, 
            C.panNo, 
            C.aadharNo, 
            C.birthday, 
            C.anniversary, 
            C.createWallet, 
            C.created_by_id, 
            C.created_date
        FROM mstcustomer C
        INNER JOIN mstcitymaster M ON C.cityid = M.cityid
        INNER JOIN mststatemaster S ON C.stateid = S.stateid
    `).all(); 

    res.json(customers);
};

exports.addCustomer = (req, res) => {
    const { 
        name, 
        countryCode, 
        mobile, 
        mail, 
        cityid, 
        address1, 
        address2, 
        stateid, 
        pincode, 
        gstNo, 
        fssai, 
        panNo, 
        aadharNo, 
        birthday, 
        anniversary, 
        createWallet, 
        created_by_id, 
        created_date 
    } = req.body;
    const stmt = db.prepare('INSERT INTO mstcustomer (name, countryCode, mobile, mail, cityid, address1, address2, stateid, pincode, gstNo, fssai, panNo, aadharNo, birthday, anniversary, createWallet, created_by_id, created_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    const result = stmt.run(name, countryCode, mobile, mail, cityid, address1, address2, stateid, pincode, gstNo, fssai, panNo, aadharNo, birthday, anniversary, createWallet ? 1 : 0, created_by_id, created_date);
    res.json({ 
        customerid: result.lastInsertRowid, 
        name, 
        countryCode, 
        mobile, 
        mail, 
        cityid, 
        address1, 
        address2, 
        stateid, 
        pincode, 
        gstNo, 
        fssai, 
        panNo, 
        aadharNo, 
        birthday, 
        anniversary, 
        createWallet, 
        created_by_id, 
        created_date 
    });
};

exports.updateCustomer = (req, res) => {
    const { id } = req.params;
    const { 
        name, 
        countryCode, 
        mobile, 
        mail, 
        cityid, 
        address1, 
        address2, 
        stateid, 
        pincode, 
        gstNo, 
        fssai, 
        panNo, 
        aadharNo, 
        birthday, 
        anniversary, 
        createWallet, 
        updated_by_id, 
        updated_date 
    } = req.body;
    const stmt = db.prepare('UPDATE mstcustomer SET name = ?, countryCode = ?, mobile = ?, mail = ?, cityid = ?, address1 = ?, address2 = ?, stateid = ?, pincode = ?, gstNo = ?, fssai = ?, panNo = ?, aadharNo = ?, birthday = ?, anniversary = ?, createWallet = ?, updated_by_id = ?, updated_date = ? WHERE customerid = ?');
    stmt.run(name, countryCode, mobile, mail, cityid, address1, address2, stateid, pincode, gstNo, fssai, panNo, aadharNo, birthday, anniversary, createWallet ? 1 : 0, updated_by_id, updated_date, id);
    res.json({ 
        customerid: id, 
        name, 
        countryCode, 
        mobile, 
        mail, 
        cityid, 
        address1, 
        address2, 
        stateid, 
        pincode, 
        gstNo, 
        fssai, 
        panNo, 
        aadharNo, 
        birthday, 
        anniversary, 
        createWallet, 
        updated_by_id, 
        updated_date 
    });
};

exports.deleteCustomer = (req, res) => {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM mstcustomer WHERE customerid = ?');
    stmt.run(id);
    res.json({ message: 'Deleted' });
};