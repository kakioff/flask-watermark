import datetime
import json
import os
import re
import time

from PIL import Image
from flask import Flask, request, render_template, url_for, send_from_directory
from pdf2image import convert_from_path
from werkzeug.utils import secure_filename, redirect

import mysql

app = Flask(__name__)
ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg'}


def pdf2image(file_path='./files/README.pdf', outpath="./files/", filename='123'):
    convert_from_path(file_path, 400, outpath, poppler_path="./poppler/bin", fmt="JPEG",
                      output_file=filename, thread_count=1)


def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/')
def hello_world():
    return render_template("index.html")
    # return 'Hello World!'


@app.route('/upload', methods=["POST"])
def update():
    """
    上传文件
    :return:
    """
    try:
        mess = {
            "success": False,
            "mess": ''
        }
        file = request.files
        if "file_logo" in file:
            file = file['file_logo']
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                filename = f"{int(time.time())}---.{filename}"
                date = datetime.datetime.now().strftime('%y%m')
                path = './files/logo/' + date
                if not os.path.exists(path):
                    os.mkdir(path)
                path += "/" + filename
                file.save(path)
                mess['success'] = True
                mess['mess'] = f"/u_files/logo\\{date}/{filename}"
                path = 'logo/' + date + '/' + filename
            else:
                mess['mess'] = "文件格式不符合规定"
        else:
            file = file['update_file']
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                filename = f"{int(time.time())}---.{filename}"
                date = datetime.datetime.now().strftime('%y%m')
                path = './files/' + date
                if not os.path.exists(path):
                    os.mkdir(path)
                path += "/" + filename
                file.save(path)
                if re.search('(.pdf|.PDF)$', filename):
                    pdf2image(path, './files/' + date, filename)
                mess['success'] = True
                mess['mess'] = "/process/" + date + '/' + filename + '/0'
                path = date + '/' + filename
            else:
                mess['mess'] = "文件格式不符合规定"
        try:
            ip = request.remote_addr
            ua = request.headers.get("User-Agent")
            sql = f"insert into upload (filename, datetime, ip, ua) values ('{path}', '{datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}', '{ip}', '{ua}')"
            sql = mysql.sql_execution(sql)
            if not sql:
                with open('./logs/' + datetime.datetime.now().strftime("%Y-%m-%d") + ".log", 'a', encoding='utf-8') as w:
                    w.writelines(f'[{datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")}] sql执行失败\n')
        except Exception as e:
            with open('./logs/' + datetime.datetime.now().strftime("%Y-%m-%d") + ".log", 'a', encoding='utf-8') as w:
                w.writelines(f'[{datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")}] 上传文件出现错误：{e}\n')

    except Exception as e:
        with open('./logs/' + datetime.datetime.now().strftime("%Y-%m-%d") + ".log", 'a', encoding='utf-8') as w:
            w.writelines(f'[{datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")}] 上传文件错误：{e}\n')
        mess = {
            "success": False,
            "mess": '上传文件出现问题，待会儿再试'
        }
    return mess


@app.route('/process/<path:date_str>/<path:filename>/<path:before>', methods=["GET", "POST"])
def process(date_str, filename, before):
    paths = []
    if request.method == "GET":
        for i in os.listdir('./files/2106'):
            if re.search('\.pdf$', filename):
                if re.search(f"{filename}0001-", i):
                    paths.append(f"/u_files/{date_str}/{i}")
            else:
                if re.search(f"{filename}", i):
                    paths.append(f"/u_files/{date_str}/{i}")
        # print(paths)
        # path = f"./files/{date_str}/{filename}0001-%s.jpg"
    else:
        print(1)

    return render_template('process.html', paths=paths, before=before)


@app.route('/u_files/<path:path1>/<path:path2>')
def u_files(path1, path2):
    return send_from_directory('./files/' + path1, path2)


@app.route('/download_image', methods=["POST"])
def download_image():
    try:
        data = json.loads(request.get_data(as_text=True))
        full_image = data.get('full_image').split('u_files')[1]
        logo_image = data.get('logo_image').split('u_files')[1]
        im = Image.open('./files/' + full_image)
        im1 = Image.open('./files/' + logo_image)
        rotate = int(data.get('route'))
        if rotate:
            if rotate == 90:
                angle = Image.ROTATE_90
            if rotate == 180:
                angle = Image.ROTATE_180
            if rotate == 270:
                angle = Image.ROTATE_270
            if rotate == 360:
                angle = Image.ROTATE_360
            im1 = im1.transpose(angle)
        im1 = im1.resize((int(data.get('width')), int(data.get('height'))), Image.ANTIALIAS)
        # im1 = im1.rotate(int(data.get('route')), expand=True, fillcolor=(255, 0, 0))
        # print(im.size, im1.size)
        im.paste(im1, (int(data.get('x')), int(data.get('y'))), im1)
        # im.show()
        im.save('./files/' + full_image)
        ip = request.remote_addr
        ua = request.headers.get("User-Agent")
        sql = f"insert into download (filename, datetime, ip, ua) values ('{full_image}', '{datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}', '{ip}', '{ua}')"
        sql = mysql.sql_execution(sql)
        if not sql:
            with open('./logs/'+datetime.datetime.now().strftime("%Y-%m-%d") + ".log", 'a', encoding='utf-8') as w:
                w.writelines(f'[{datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")}] sql执行失败\n')
        # print(data)
        return {
            "success": True,
            "mess": data.get('full_image')
        }
    except Exception as e:
        with open('./logs/'+datetime.datetime.now().strftime("%Y-%m-%d") + ".log", 'a', encoding='utf-8') as w:
            w.writelines(f'[{datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")}] 下载图片错误：{e}\n')
        return {
            "success": False,
            "mess": "下载出现问题，待会儿再试"
        }


@app.route('/about')
def about():
    return render_template('readme.html')


if __name__ == '__main__':
    app.run()
