import { QueryResult } from 'pg';
import { pool, connectToDb } from './connection.js';
import inquirer from 'inquirer';

await connectToDb();


function init() {
  console.log('Welcome to the Employee Tracker!');
  console.log('Please select an option:');
  mainMenu();
}

function mainMenu() {
  inquirer
    .prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          'View all departments',
          'View all roles',
          'View all employees',
          'Add a department',
          'Add a role',
          'Add an employee',
          'Update an employee role',
          'Exit'
        ]
      }
    ])
    .then((answers:any) => {
      switch (answers.action) {
        case 'View all departments':
          viewDepartments();
          break;
        case 'View all roles':
          viewRoles();
          break;
        case 'View all employees':
          viewEmployees();
          break;
        case 'Add a department':
          addDepartment();
          break;
        case 'Add a role':
          addRole();
          break;
        case 'Add an employee':
          addEmployee();
          break;
        case 'Update an employee role':
          updateEmployeeRole();
          break;
        case 'Exit':
          pool.end();
          console.log('Goodbye!');
          break;
      }
    });
}
function viewDepartments() {
  pool.query('SELECT * FROM department', (error, results: QueryResult) => {
    if (error) {
      console.error('Error fetching departments:', error);
      return;
    }
    console.table(results.rows);
    mainMenu();
  });
}
function viewRoles() {
  pool.query('SELECT * FROM role', (error, results: QueryResult) => {
    if (error) {
      console.error('Error fetching roles:', error);
      return;
    }
    console.table(results.rows);
    mainMenu();
  });
}
function viewEmployees() {
  pool.query(
    `SELECT employee.id, employee.first_name, employee.last_name, role.title, department.name AS department, role.salary, CONCAT(manager.first_name, ' ', manager.last_name) AS manager
     FROM employee
     LEFT JOIN role ON employee.role_id = role.id
     LEFT JOIN department ON role.department_id = department.id
     LEFT JOIN employee AS manager ON employee.manager_id = manager.id`,
    (error, results: QueryResult) => {
      if (error) {
        console.error('Error fetching employees:', error);
        return;
      }
      console.table(results.rows);
      mainMenu();
    }
  );
}
function addDepartment() {
  inquirer
    .prompt([
      {
        type: 'input',
        name: 'departmentName',
        message: 'Enter the name of the department:'
      }
    ])
    .then((answers:any) => {
      const { departmentName } = answers;
      pool.query(
        'INSERT INTO department (name) VALUES ($1)',
        [departmentName],
        (error) => {
          if (error) {
            console.error('Error adding department:', error);
            return;
          }
          console.log(`Department ${departmentName} added successfully!`);
          mainMenu();
        }
      );
    });
}
function addRole() {
  pool.query('SELECT * FROM department', (error, results: QueryResult) => {
    if (error) {
      console.error('Error fetching departments:', error);
      return;
    }
    const departments = results.rows.map((row) => ({
      name: row.name,
      value: row.id
    }));
    inquirer
      .prompt([
        {
          type: 'input',
          name: 'roleTitle',
          message: 'Enter the title of the role:'
        },
        {
          type: 'input',
          name: 'roleSalary',
          message: 'Enter the salary of the role:'
        },
        {
          type: 'list',
          name: 'departmentId',
          message: 'Select the department for this role:',
          choices: departments
        }
      ])
      .then((answers:any) => {
        const { roleTitle, roleSalary, departmentId } = answers;
        pool.query(
          'INSERT INTO role (title, salary, department_id) VALUES ($1, $2, $3)',
          [roleTitle, roleSalary, departmentId],
          (error) => {
            if (error) {
              console.error('Error adding role:', error);
              return;
            }
            console.log(`Role ${roleTitle} added successfully!`);
            mainMenu();
          }
        );
      });
  });
}
function addEmployee() {
  pool.query('SELECT * FROM role', (error, results: QueryResult) => {
    if (error) {
      console.error('Error fetching roles:', error);
      return;
    }
    const roles = results.rows.map((row) => ({
      name: row.title,
      value: row.id
    }));
    pool.query('SELECT * FROM employee', (error, results: QueryResult) => {
      if (error) {
        console.error('Error fetching employees:', error);
        return;
      }
      const employees = results.rows.map((row) => ({
        name: `${row.first_name} ${row.last_name}`,
        value: row.id
      }));
      inquirer
        .prompt([
          {
            type: 'input',
            name: 'firstName',
            message: 'Enter the first name of the employee:'
          },
          {
            type: 'input',
            name: 'lastName',
            message: 'Enter the last name of the employee:'
          },
          {
            type: 'list',
            name: 'roleId',
            message: 'Select the role for this employee:',
            choices: roles
          },
          {
            type: 'list',
            name: 'managerId',
            message: 'Select the manager for this employee:',
            choices: [...employees, { name: 'None', value: null }]
          }
        ])
        .then((answers:any) => {
          const { firstName, lastName, roleId, managerId } = answers;
          pool.query(
            'INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES ($1, $2, $3, $4)',
            [firstName, lastName, roleId, managerId],
            (error) => {
              if (error) {
                console.error('Error adding employee:', error);
                return;
              }
              console.log(`Employee ${firstName} ${lastName} added successfully!`);
              mainMenu();
            }
          );
        });
    });
  });
}
function updateEmployeeRole() {
  pool.query('SELECT * FROM employee', (error, results: QueryResult) => {
    if (error) {
      console.error('Error fetching employees:', error);
      return;
    }
    const employees = results.rows.map((row) => ({
      name: `${row.first_name} ${row.last_name}`,
      value: row.id
    }));
    pool.query('SELECT * FROM role', (error, results: QueryResult) => {
      if (error) {
        console.error('Error fetching roles:', error);
        return;
      }
      const roles = results.rows.map((row) => ({
        name: row.title,
        value: row.id
      }));
      inquirer
        .prompt([
          {
            type: 'list',
            name: 'employeeId',
            message: 'Select the employee to update:',
            choices: employees
          },
          {
            type: 'list',
            name: 'roleId',
            message: 'Select the new role for this employee:',
            choices: roles
          }
        ])
        .then((answers:any) => {
          const { employeeId, roleId } = answers;
          pool.query(
            'UPDATE employee SET role_id = $1 WHERE id = $2',
            [roleId, employeeId],
            (error) => {
              if (error) {
                console.error('Error updating employee role:', error);
                return;
              }
              console.log(`Employee role updated successfully!`);
              mainMenu();
            }
          );
        });
    });
  });
}
init();