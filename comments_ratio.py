#!/usr/bin/env python

import re
import sys



with open("staged_js.txt", 'r') as git:
	staged_js = git.read().split('\n')

staged_js = filter(lambda x: len(x)>0, staged_js)
# staged_js = []
# committed_line = -1
# for i in range(len(git_status)):
# 	if git_status[i] == 'Changes to be committed:':
# 		committed_line = i
# 		break
# # print committed_line
# for i in range(committed_line + 3, len(git_status), 1):
# 	# print git_status[i]
# 	if len(git_status) > 3 and ('new file' in git_status[i] or 'modified' in git_status[i]):
# 		staged_js.append(git_status[i].split('   ')[1])
# 	else:
# 		break

# print staged_js
# print staged_js
if len(staged_js) > 0:
	for file in staged_js:
		with open(file, "r") as f:
			buf = f.read()
		comment_num = 0
		pattern1 = r"//.*\n"
		#print pattern1.match(buf)
		comment_num += len( re.findall(pattern1, buf) )

		pattern2 = r"/\*[^*]*\*/"
		res = re.findall(pattern2, buf)
		comment_num += len(res)

		for i in res:
			comment_num += len(re.findall(r"\n", i))

		with open(file, "r") as f:
			buf = f.readlines()

		code_num = len(buf)

		print file + " - Code: %d lines, Comment: %d lines, Ratio:%.2f%%" % ( code_num, comment_num, float(comment_num)/code_num)
else:
	print "No js file in staging!"