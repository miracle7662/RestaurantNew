const db = require('../config/db');

exports.getMenu = (req, res) => {
    const Menu = db.prepare('SELECT * FROM mstmenu').all();
    res.json(Menu);
};

exports.addMenu = (req, res) => {
    const { outlet_id, hotel_name_id, item_no, item_name, print_name,short_name, kitchen_category_id, kitchen_sub_category_id, kitchen_main_group_id, item_group_id, item_main_group_id, stock_unit, price, tax, runtime_rates, is_common_to_all_departments,  status, created_by_id, created_date } = req.body;
    const stmt = db.prepare('INSERT INTO mstmenu (outlet_id, hotel_name_id, item_no, item_name, print_name,short_name, kitchen_category_id, kitchen_sub_category_id, kitchen_main_group_id, item_group_id, item_main_group_id, stock_unit, price, tax, runtime_rates, is_common_to_all_departments,  status, created_by_id, created_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    const result = stmt.run(outlet_id, hotel_name_id, item_no, item_name, print_name,short_name, kitchen_category_id, kitchen_sub_category_id, kitchen_main_group_id, item_group_id, item_main_group_id, stock_unit, price, tax, runtime_rates, is_common_to_all_departments,  status, created_by_id, created_date);
    res.json({ id: result.lastInsertRowid, outlet_id, hotel_name_id, item_no, item_name, print_name,short_name, kitchen_category_id, kitchen_sub_category_id, kitchen_main_group_id, item_group_id, item_main_group_id, stock_unit, price, tax, runtime_rates, is_common_to_all_departments,  status, created_by_id, created_date });
};

exports.updateMenu = (req, res) => {
    const { id } = req.params;
    const { outlet_id, hotel_name_id, item_no, item_name, print_name,short_name, kitchen_category_id, kitchen_sub_category_id, kitchen_main_group_id, item_group_id, item_main_group_id, stock_unit, price, tax, runtime_rates, is_common_to_all_departments,  status, updated_by_id, updated_date } = req.body;
    const stmt = db.prepare('UPDATE mstmenu SET outlet_id = ?, hotel_name_id = ?, item_no = ?, item_name = ?, print_name = ?, short_name = ?, kitchen_category_id = ?, kitchen_sub_category_id = ?, kitchen_main_group_id = ?, item_group_id = ?, item_main_group_id = ?, stock_unit = ?, price = ?, tax = ?, runtime_rates = ?, is_common_to_all_departments = ?,  status = ?, updated_by_id = ?, updated_date = ? WHERE menuid = ?');
    stmt.run(outlet_id, hotel_name_id, item_no, item_name, print_name,short_name, kitchen_category_id, kitchen_sub_category_id, kitchen_main_group_id, item_group_id, item_main_group_id, stock_unit, price, tax, runtime_rates, is_common_to_all_departments,  status, updated_by_id, updated_date, id);
    res.json({ id, outlet_id, hotel_name_id, item_no, item_name, print_name,short_name, kitchen_category_id, kitchen_sub_category_id, kitchen_main_group_id, item_group_id, item_main_group_id, stock_unit, price, tax, runtime_rates, is_common_to_all_departments,  status, updated_by_id, updated_date });
};

exports.deleteMenu = (req, res) => {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM mstmenu WHERE menuid = ?');
    stmt.run(id);
    res.json({ message: 'Deleted' });
};