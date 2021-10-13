"""
SQL的执行文件
"""

import datetime
import re
import sqlite3

import MySQLdb


def sql_execution(sql):
    """
    SQL语句执行
    :param sql: SQL代码
    :return: 执行结果
    """
    try:
        conn = MySQLdb.connect(
            host="127.0.0.1",
            port=3306,
            user="watermark",
            passwd="Abc123..",
            db="watermark",
            charset='utf8mb4'
        )
        cur = conn.cursor()
        cur.execute(sql)
        if re.search('^select', sql, re.IGNORECASE):
            # 判断为查询语句
            return cur.fetchall()
        else:
            # 判断为执行语句
            cur.connection.commit()
            return True
    except MySQLdb.Error as e:
        with open('./logs/'+datetime.datetime.now().strftime("%Y-%m-%d") + ".log", 'a', encoding='utf-8') as w:
            w.writelines(f'[{datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")}] sql执行错误：{e}\n')
        return False


