'''
Create a text file contains all .js files in the stage area, 
and print out all the files in stage area.
'''

with open("stage.txt", 'r') as git:
	git_status = git.read().split('\n')

staged_js = []
committed_line = -1
for i in range(len(git_status)):
	if git_status[i] == 'Changes to be committed:':
		committed_line = i
		break
# print committed_line
for i in range(committed_line + 3, len(git_status), 1):
	# print git_status[i]
	if len(git_status) > 3 and ('new file' in git_status[i] or 'modified' in git_status[i]):
		staged_js.append(git_status[i].split('   ')[1])
	else:
		break



js =  open("staged_js.txt", 'w')

for f in staged_js:
	print f
	if f[-3:] == 'js':
		print >> js, f
js.close()
