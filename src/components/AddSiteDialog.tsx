import React, { type FC } from 'react'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import TextField from '@mui/material/TextField'

export interface AddSiteDialogProps {
  open: boolean
  onSiteAdded: (site: string) => void
  onClose: () => void
}

export const AddSiteDialog: FC<AddSiteDialogProps> = ({ open, onSiteAdded, onClose }) => {
  const [textInput, setTextInput] = React.useState('')

  const handleClose = (): void => {
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Add site</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Add a USGS site to the dashboard. Sites can be found <a href="https://maps.waterdata.usgs.gov/mapper/index.html">here</a>.
        </DialogContentText>
        <TextField
          autoFocus
          margin="dense"
          id="name"
          label="Site number"
          fullWidth
          variant="outlined"
          sx={{ marginTop: '24px' }}
          value= {textInput}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            setTextInput(event.target.value)
          }}
        />
      </DialogContent>
      <DialogActions sx={{ textAlign: 'right' }}>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={() => {
          onSiteAdded(textInput)
          handleClose()
        }}>
          Add
        </Button>
      </DialogActions>
    </Dialog>
  )
}